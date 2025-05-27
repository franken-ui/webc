import { type PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { validateDate } from '../helpers/common';
import { repeat } from 'lit/directives/repeat.js';
import { BaseCalendar } from './shared/base-calendar';

/**
 * Represents a single day cell in the calendar grid.
 *
 * @interface Day
 */
interface Day {
  /** The numerical day of the month (1-31). */
  date: number;
  /** Which month this day belongs to relative to the current view. */
  month: 'prev' | 'current' | 'next';
  /** Whether this day is the current date being viewed. */
  isCurrent: boolean;
  /** Whether this day is disabled and cannot be selected. */
  isDisabled: boolean;
  /** Whether this day has been marked with special styling. */
  isMarked: boolean;
  /** ISO string representation of this date. */
  ISOString: string;
}

/**
 * CSS class names for styling the calendar component.
 *
 * @interface Cls
 * @extends {Record<string, string>}
 */
interface Cls extends Record<string, string> {
  /** CSS class for the main calendar container. */
  div: string;
}

/**
 * Interactive calendar component for date selection.
 *
 * @element uk-calendar
 * @extends {BaseCalendar}
 *
 * Features:
 * - Single date selection with keyboard navigation
 * - Month/year navigation with optional jumper controls
 * - Disabled dates and marked dates support
 * - Customizable week start day and date ranges
 * - Full accessibility support with ARIA attributes
 * - Responsive grid layout with proper focus management
 *
 * @fires uk-calendar:change - Dispatched when a date is selected
 *
 * @example
 * ```html
 * <uk-calendar
 *   value="2025-05-29"
 *   min="2025-01-01"
 *   max="2025-12-31"
 *   jumpable
 *   starts-with="1">
 * </uk-calendar>
 * ```
 */
@customElement('uk-calendar')
export class Calendar extends BaseCalendar {
  /**
   * The default element key used for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the div element.
   */
  protected 'cls-default-element' = 'div';

  /**
   * Custom event name emitted when value changes.
   * Used for dispatching change events from this component.
   */
  protected 'input-event' = 'uk-calendar:change';

  /**
   * Currently selected date as an ISO string.
   * Synced with the calendar grid selection.
   * @internal
   */
  @state()
  private $active: string | undefined;

  /**
   * CSS classes for component styling.
   * Allows customization of the main calendar container.
   * @internal
   */
  @state()
  protected $cls: Cls = {
    div: '',
  };

  /**
   * Gets the current selected value as a date string (YYYY-MM-DD).
   *
   * @returns The selected date in YYYY-MM-DD format, or empty string if none selected.
   * @protected
   */
  protected get $value(): string {
    if (this.$active) {
      return this.$active.slice(0, 10);
    }
    return '';
  }

  /**
   * Gets the display text for the selected date.
   *
   * @returns Empty string as calendar doesn't display selected date as text.
   * @protected
   */
  protected get $text(): string {
    return '';
  }

  /**
   * Initializes the calendar's selected date from the value property or today's date.
   * Sets up the initial view date and active selection based on component properties.
   * @protected
   */
  protected initializeValue(): void {
    if (this.value) {
      try {
        const date = validateDate(this.value);
        this.$active = date.toISOString();
        this['view-date'] = date.toISOString().slice(0, 10);
      } catch (e) {
        console.error(`${this.value} has an invalid format.`);
      }
    } else if (this.today === true) {
      this.$active = this.getUTCDate(new Date()).toISOString();
    }
  }

  /**
   * Component connected to DOM - set up keyboard event listeners.
   * @override
   */
  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this.navigate);
  }

  /**
   * Component disconnected from DOM - clean up event listeners.
   * @override
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.navigate);
  }

  /**
   * Called after component updates - manages focus for selected dates.
   *
   * @param changedProperties - Properties that changed in this update cycle.
   * @override
   */
  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('$active')) {
      this.updateComplete.then(() => {
        const button = this.renderRoot.querySelector(
          `button[data-iso="${this.$active}"]`,
        ) as HTMLButtonElement;

        if (button && this.isDirty === true) {
          button.focus();
        }
      });

      this.emit();
    }
  }

  /**
   * Handles keyboard navigation within the calendar grid.
   * Supports arrow keys, Home/End, Page Up/Down, Enter, and Space.
   *
   * @param event - The keyboard event to process.
   * @private
   */
  private navigate = (event: KeyboardEvent): void => {
    const currentButton = event.target as HTMLButtonElement;

    if (!currentButton?.matches('button[data-iso]')) {
      return;
    }

    const buttons: HTMLButtonElement[] = Array.from(
      this.querySelectorAll('button[data-iso]'),
    );
    const currentIndex = buttons.indexOf(currentButton);
    const grid = this.getGridPosition(currentButton);

    if (!grid) {
      return;
    }

    const { rowIndex, colIndex } = grid;
    let nextButton: HTMLButtonElement | undefined;

    const navigationMap: Record<string, () => HTMLButtonElement | undefined> = {
      ArrowLeft: () => this.findNextEnabled(buttons, currentIndex - 1, -1),
      ArrowRight: () => this.findNextEnabled(buttons, currentIndex + 1, 1),
      ArrowUp: () => this.getNextEnabledInColumn(rowIndex - 1, colIndex, -1),
      ArrowDown: () => this.getNextEnabledInColumn(rowIndex + 1, colIndex, 1),
      Home: () => this.getRowFirstEnabledButton(rowIndex),
      End: () => this.getRowLastEnabledButton(rowIndex),
      PageUp: () => this.getNextEnabledInColumn(0, colIndex, 1),
      PageDown: () => {
        const rows = this.querySelectorAll('tr');
        return this.getNextEnabledInColumn(rows.length - 1, colIndex, -1);
      },
    };

    if (event.key in navigationMap) {
      event.preventDefault();
      nextButton = navigationMap[event.key]();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      currentButton.click();
      return;
    }

    nextButton?.focus();
  };

  /**
   * Finds the next enabled button in a linear sequence.
   *
   * @param buttons - Array of all calendar buttons.
   * @param start - Starting index for search.
   * @param increment - Direction to search (1 for forward, -1 for backward).
   * @returns The next enabled button, or undefined if none found.
   * @private
   */
  private findNextEnabled(
    buttons: HTMLButtonElement[],
    start: number,
    increment: number,
  ): HTMLButtonElement | undefined {
    let index = start;

    while (index >= 0 && index < buttons.length) {
      const button = buttons[index];
      if (!button.disabled) {
        return button;
      }
      index += increment;
    }

    return undefined;
  }

  /**
   * Finds the next enabled button in a specific column.
   *
   * @param startRow - Row index to start searching from.
   * @param colIndex - Column index to search within.
   * @param increment - Direction to search (1 for down, -1 for up).
   * @returns The next enabled button in the column, or undefined if none found.
   * @private
   */
  private getNextEnabledInColumn(
    startRow: number,
    colIndex: number,
    increment: number,
  ): HTMLButtonElement | undefined {
    const rows = Array.from(this.querySelectorAll('tr'));
    let rowIndex = startRow;

    while (rowIndex >= 0 && rowIndex < rows.length) {
      const button = rows[rowIndex]?.children[colIndex]?.querySelector(
        'button',
      ) as HTMLButtonElement;

      if (button && !button.disabled) {
        return button;
      }

      rowIndex += increment;
    }

    return undefined;
  }

  /**
   * Gets the first enabled button in a specific row.
   *
   * @param rowIndex - The row index to search within.
   * @returns The first enabled button in the row, or undefined if none found.
   * @private
   */
  private getRowFirstEnabledButton(
    rowIndex: number,
  ): HTMLButtonElement | undefined {
    const row = this.querySelectorAll('tr')[rowIndex];
    const buttons = Array.from(row?.querySelectorAll('button') || []);
    return buttons.find(button => !button.disabled) as HTMLButtonElement;
  }

  /**
   * Gets the last enabled button in a specific row.
   *
   * @param rowIndex - The row index to search within.
   * @returns The last enabled button in the row, or undefined if none found.
   * @private
   */
  private getRowLastEnabledButton(
    rowIndex: number,
  ): HTMLButtonElement | undefined {
    const row = this.querySelectorAll('tr')[rowIndex];
    const buttons = Array.from(row?.querySelectorAll('button') || []);
    return buttons
      .reverse()
      .find(button => !button.disabled) as HTMLButtonElement;
  }

  /**
   * Gets the grid position (row and column) of a button element.
   *
   * @param button - The button element to locate.
   * @returns Object with rowIndex and colIndex, or null if not found.
   * @private
   */
  private getGridPosition(button: HTMLButtonElement) {
    const td = button.closest('td');
    const tr = td?.closest('tr');
    if (!tr) return null;

    return {
      rowIndex: Array.from(this.querySelectorAll('tr')).indexOf(tr),
      colIndex: Array.from(tr.children).indexOf(td!),
    };
  }

  /**
   * Selects a specific day and updates the calendar state.
   *
   * @param day - The day object to select.
   * @private
   */
  private select(day: Day): void {
    this.$active = day.ISOString;

    if (day.month !== 'current') {
      this['view-date'] = day.ISOString.slice(0, 10);
    }

    if (this.isDirty === false) {
      this.isDirty = true;
    }
  }

  /**
   * Checks if a given date should be disabled.
   *
   * @param date - ISO string of the date to check.
   * @returns True if the date should be disabled.
   * @private
   */
  private isDisabled(date: string): boolean {
    return (
      this.parseDates(this['disabled-dates']).includes(date.slice(0, 10)) ||
      !this.isDateInRange(date)
    );
  }

  /**
   * Navigates to the previous or next month.
   *
   * @param direction - Direction to navigate ('prev' or 'next').
   * @private
   */
  private navigateMonth(direction: 'prev' | 'next') {
    let month = this.$viewDate.getMonth();
    let year = this.$viewDate.getFullYear();

    if (direction === 'prev') {
      if (month === 0) {
        month = 11;
        year -= 1;
      } else {
        month -= 1;
      }
    } else {
      if (month === 11) {
        month = 0;
        year += 1;
      } else {
        month += 1;
      }
    }

    this['view-date'] =
      `${year.toString()}-${(month + 1).toString().padStart(2, '0')}-01`;
  }

  /**
   * Jumps to a specific month in the current year.
   *
   * @param month - Zero-based month index (0 = January, 11 = December).
   * @private
   */
  private selectMonth(month: number) {
    const date = this['view-date'];
    this['view-date'] =
      date.substring(0, 5) +
      (month + 1).toString().padStart(2, '0') +
      date.substring(7);
  }

  /**
   * Sets the view to a specific year.
   *
   * @param year - Four-digit year string.
   * @private
   */
  private setYear(year: string) {
    if (/^\d{4}$/.test(year)) {
      this['view-date'] = year.toString() + this['view-date'].substring(4);
    }
  }

  /**
   * Gets the localized weekday abbreviations in the correct order.
   *
   * @returns Array of weekday abbreviations starting with the configured start day.
   * @private
   */
  private getWeekdays(): string[] {
    const weekdays = this.$locales.weekdays as string[];

    if (this['starts-with'] === 1) {
      weekdays.push(weekdays.shift()!);
    }

    return weekdays.map(day => day.substring(0, this['weekday-abbr-length']));
  }

  /**
   * Generates the complete calendar grid as a 2D array of Day objects.
   *
   * @returns 2D array representing weeks and days for the current view month.
   * @private
   */
  private get calendar(): Day[][] {
    const { year, month } = {
      year: this.$viewDate.getFullYear(),
      month: this.$viewDate.getMonth() + 1,
    };

    const { currentMonth, daysInCurrentMonth, daysInPrevMonth } =
      this.getMonthInfo(year, month);
    const startingDay = this.getStartingDay(currentMonth);

    return this.createGrid(year, month, {
      startingDay,
      daysInCurrentMonth,
      daysInPrevMonth,
    });
  }

  /**
   * Gets essential information about a specific month.
   *
   * @param year - The year.
   * @param month - The month (1-12).
   * @returns Object containing month info including first day and day counts.
   * @private
   */
  private getMonthInfo(year: number, month: number) {
    return {
      currentMonth: new Date(year, month - 1, 1),
      daysInCurrentMonth: new Date(year, month, 0).getDate(),
      daysInPrevMonth: new Date(year, month - 1, 0).getDate(),
    };
  }

  /**
   * Calculates which day of the week the month starts on.
   *
   * @param currentMonth - Date object for the first day of the month.
   * @returns Day of week index adjusted for the configured start day.
   * @private
   */
  private getStartingDay(currentMonth: Date): number {
    return (currentMonth.getDay() - this['starts-with'] + 7) % 7;
  }

  /**
   * Creates the calendar grid with all days for the month view.
   *
   * @param year - The year.
   * @param month - The month (1-12).
   * @param config - Configuration object with grid parameters.
   * @returns 2D array of Day objects representing the calendar grid.
   * @private
   */
  private createGrid(
    year: number,
    month: number,
    {
      startingDay,
      daysInCurrentMonth,
      daysInPrevMonth,
    }: {
      startingDay: number;
      daysInCurrentMonth: number;
      daysInPrevMonth: number;
    },
  ): Day[][] {
    const calendar: Day[][] = [];
    let date = 1;
    let prevMonthStartDate = daysInPrevMonth - startingDay + 1;

    for (let week = 0; week < 6; week++) {
      const currentWeek: Day[] = [];

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dayInfo = this.getDayInfo(
          year,
          month,
          date,
          dayOfWeek,
          week,
          startingDay,
          daysInCurrentMonth,
          prevMonthStartDate,
        );

        currentWeek.push(dayInfo.day);
        ({ date, prevMonthStartDate } = dayInfo);
      }

      calendar.push(currentWeek);

      if (date > daysInCurrentMonth && currentWeek[6].month === 'next') {
        break;
      }
    }

    return calendar;
  }

  /**
   * Creates a Day object for a specific position in the calendar grid.
   *
   * @param year - The year.
   * @param month - The month (1-12).
   * @param date - Current date counter.
   * @param dayOfWeek - Day of week index (0-6).
   * @param week - Week index in the grid.
   * @param startingDay - Which day of week the month starts on.
   * @param daysInCurrentMonth - Total days in the current month.
   * @param prevMonthStartDate - Starting date for previous month days.
   * @returns Object containing the Day object and updated counters.
   * @private
   */
  private getDayInfo(
    year: number,
    month: number,
    date: number,
    dayOfWeek: number,
    week: number,
    startingDay: number,
    daysInCurrentMonth: number,
    prevMonthStartDate: number,
  ) {
    let currentDate: number;
    let monthOffset: number;

    if (week === 0 && dayOfWeek < startingDay) {
      currentDate = prevMonthStartDate++;
      monthOffset = -1;
    } else if (date > daysInCurrentMonth) {
      currentDate = date - daysInCurrentMonth;
      monthOffset = 1;
      date++;
    } else {
      currentDate = date++;
      monthOffset = 0;
    }

    const fullDate = new Date(
      Date.UTC(year, month - 1 + monthOffset, currentDate),
    );
    const ISOString = fullDate.toISOString();

    const day: Day = {
      date: currentDate,
      month:
        monthOffset === -1 ? 'prev' : monthOffset === 1 ? 'next' : 'current',
      isCurrent: currentDate === this.$viewDate.getDate() && monthOffset === 0,
      isDisabled: this.isDisabled(ISOString),
      isMarked: this.parseDates(this['marked-dates']).includes(
        ISOString.slice(0, 10),
      ),
      ISOString,
    };

    return { day, date, prevMonthStartDate };
  }

  /**
   * Renders the main calendar component.
   *
   * @returns Lit template for the complete calendar.
   */
  render() {
    return html`
      <div
        data-host-inner
        class="${this.$cls['div']} uk-cal"
        role="application"
      >
        ${this.renderHeader()}
        <table role="grid" aria-label="Calendar">
          <thead>
            <tr role="row">
              ${repeat(
                this.getWeekdays(),
                day => day,
                day => html`<th role="columnheader" scope="col">${day}</th>`,
              )}
            </tr>
          </thead>
          <tbody>
            ${repeat(
              this.calendar,
              week => week[0].ISOString,
              this.renderWeek.bind(this),
            )}
          </tbody>
        </table>
        ${this.renderHidden()}
      </div>
    `;
  }

  /**
   * Renders the calendar header with navigation controls.
   *
   * @returns Lit template for the header section.
   * @private
   */
  private renderHeader() {
    const info = this.getTimestampComponent(this.$viewDate);

    return html`
      <div class="uk-cal-header">
        <button
          class="uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
          @click=${() => this.navigateMonth('prev')}
          type="button"
          data-uk-pgn-previous
        ></button>
        <div class="uk-cal-jumper">
          ${this.jumpable
            ? this.renderJumper()
            : html`
                <div class="uk-cal-title uk-text-sm">
                  ${info.monthName} ${info.year}
                </div>
              `}
        </div>
        <button
          class="uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
          @click=${() => this.navigateMonth('next')}
          type="button"
          data-uk-pgn-next
        ></button>
      </div>
    `;
  }

  /**
   * Renders the month/year jumper controls when jumpable is enabled.
   *
   * @returns Lit template for the jumper controls.
   * @private
   */
  private renderJumper() {
    const months = this.$locales.months as string[];
    const info = this.getTimestampComponent(this.$viewDate);

    return html`
      <div class="uk-inline uk-cal-month-dropdown">
        <button class="uk-input-fake uk-form-sm" type="button">
          ${info.monthName}
        </button>
        <div
          class="uk-drop uk-dropdown"
          data-uk-dropdown="mode: click; animation: uk-anmt-slide-top-sm;"
          tabindex="-1"
        >
          <ul class="uk-nav uk-dropdown-nav">
            ${months.map(
              (_, index) => html`
                <li
                  class="${index + 1 === info.month
                    ? 'uk-active'
                    : ''} uk-cal-month-dropdown-item"
                >
                  <a @click="${() => this.selectMonth(index)}">
                    ${months[index]}
                    ${index + 1 === info.month
                      ? html`<span data-uk-check-icon></span>`
                      : ''}
                  </a>
                </li>
              `,
            )}
          </ul>
        </div>
      </div>
      <input
        class="uk-input uk-form-sm"
        type="number"
        step="1"
        .value="${info.year.toString()}"
        min="1000"
        max="9999"
        @blur="${(e: Event) => {
          const input = e.target as HTMLInputElement;
          input.value = info.year.toString();
        }}"
        @input="${(e: Event) => {
          const input = e.target as HTMLInputElement;
          input.value = input.value.replace(/[^0-9]/g, '').substring(0, 4);

          if (input.value.length === 4) {
            this.setYear(input.value);
          }
        }}"
        type="text"
      />
    `;
  }

  /**
   * Renders a single week row in the calendar.
   *
   * @param days - Array of Day objects for the week.
   * @returns Lit template for the week row.
   * @private
   */
  private renderWeek(days: Day[]): unknown {
    return html`
      <tr role="row">
        ${repeat(days, day => day.ISOString, this.renderDay.bind(this))}
      </tr>
    `;
  }

  /**
   * Renders a single day cell in the calendar grid.
   *
   * @param day - The Day object to render.
   * @returns Lit template for the day cell.
   * @private
   */
  private renderDay(day: Day): unknown {
    const isSelected = this.$active === day.ISOString;
    const month =
      day.month === 'current' ? 'current month' : `${day.month} month`;
    const outOfRange = !this.isDateInRange(day.ISOString);
    const ariaLabel = `${day.date} ${month}${isSelected ? ', selected' : ''}${day.isDisabled ? ', disabled' : ''}${outOfRange ? ', out of allowed date range' : ''}`;

    return html`
      <td
        class="${day.month !== 'current' ? 'uk-cal-oom' : ''} ${isSelected
          ? 'uk-active'
          : ''} ${day.isMarked ? 'uk-cal-marked' : ''}"
        role="gridcell"
      >
        <button
          type="button"
          data-iso="${day.ISOString}"
          @click="${() => this.select(day)}"
          aria-label="${ariaLabel}"
          aria-selected="${isSelected}"
          aria-disabled="${day.isDisabled}"
          .disabled="${day.isDisabled}"
        >
          ${day.date}
        </button>
      </td>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-calendar': Calendar;
  }
}
