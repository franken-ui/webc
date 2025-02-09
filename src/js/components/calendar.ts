import { PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { validateDate } from '../helpers/common';
import { repeat } from 'lit/directives/repeat.js';
import { BaseCalendar } from './shared/base-calendar';

interface Day {
  date: number;
  month: 'prev' | 'current' | 'next';
  isCurrent: boolean;
  isDisabled: boolean;
  isMarked: boolean;
  ISOString: string;
}

interface Cls extends Record<string, string> {
  calendar: string;
}

@customElement('uk-calendar')
export class Calendar extends BaseCalendar {
  protected 'cls-default-element' = 'calendar';

  protected 'input-event' = 'uk-calendar:change';

  @state()
  private $active: string | undefined;

  @state()
  protected $cls: Cls = {
    calendar: '',
  };

  protected get $value(): string {
    if (this.$active) {
      return this.$active.slice(0, 10);
    }

    return '';
  }

  protected get $text(): string {
    return '';
  }

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

  connectedCallback(): void {
    super.connectedCallback();

    this.addEventListener('keydown', this.navigate);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this.navigate);
  }

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

    const findNextEnabled = (
      buttons: HTMLButtonElement[],
      start: number,
      increment: number,
    ): HTMLButtonElement | undefined => {
      let index = start;

      while (index >= 0 && index < buttons.length) {
        const button = buttons[index];

        if (!button.disabled) {
          return button;
        }

        index += increment;
      }

      return undefined;
    };

    const navigationMap: Record<string, () => HTMLButtonElement | undefined> = {
      ArrowLeft: () => findNextEnabled(buttons, currentIndex - 1, -1),
      ArrowRight: () => findNextEnabled(buttons, currentIndex + 1, 1),
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

  private getRowFirstEnabledButton(
    rowIndex: number,
  ): HTMLButtonElement | undefined {
    const row = this.querySelectorAll('tr')[rowIndex];
    const buttons = Array.from(row?.querySelectorAll('button') || []);

    return buttons.find(button => !button.disabled) as HTMLButtonElement;
  }

  private getRowLastEnabledButton(
    rowIndex: number,
  ): HTMLButtonElement | undefined {
    const row = this.querySelectorAll('tr')[rowIndex];
    const buttons = Array.from(row?.querySelectorAll('button') || []);

    return buttons
      .reverse()
      .find(button => !button.disabled) as HTMLButtonElement;
  }

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

  private selectMonth(month: number) {
    const date = this['view-date'];

    this['view-date'] =
      date.substring(0, 5) +
      (month + 1).toString().padStart(2, '0') +
      date.substring(7);
  }

  private setYear(year: string) {
    if (/^\d{4}$/.test(year)) {
      this['view-date'] = year.toString() + this['view-date'].substring(4);
    }
  }

  private getGridPosition(button: HTMLButtonElement) {
    const td = button.closest('td');
    const tr = td?.closest('tr');
    if (!tr) return null;

    return {
      rowIndex: Array.from(this.querySelectorAll('tr')).indexOf(tr),
      colIndex: Array.from(tr.children).indexOf(td!),
    };
  }

  private select(day: Day): void {
    this.$active = day.ISOString;

    if (day.month !== 'current') {
      this['view-date'] = day.ISOString.slice(0, 10);
    }

    if (this.isDirty === false) {
      this.isDirty = true;
    }
  }

  private isDisabled(date: string): boolean {
    return (
      this.parseDates(this['disabled-dates']).includes(date.slice(0, 10)) ||
      !this.isDateInRange(date)
    );
  }

  private getWeekdays(): string[] {
    const weekdays = this.$locales.weekdays as string[];

    if (this['starts-with'] === 1) {
      weekdays.push(weekdays.shift()!);
    }

    return weekdays.map(a => a.substring(0, 2));
  }

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

  private getMonthInfo(year: number, month: number) {
    return {
      currentMonth: new Date(year, month - 1, 1),
      daysInCurrentMonth: new Date(year, month, 0).getDate(),
      daysInPrevMonth: new Date(year, month - 1, 0).getDate(),
    };
  }

  private getStartingDay(currentMonth: Date): number {
    return (currentMonth.getDay() - this['starts-with'] + 7) % 7;
  }

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

  private renderWeek(days: Day[]): unknown {
    return html`
      <tr role="row">
        ${repeat(days, day => day.ISOString, this.renderDay.bind(this))}
      </tr>
    `;
  }

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

  private renderJumper() {
    const months = this.$locales.months as string[];
    const info = this.getTimestampComponent(this.$viewDate);

    return html`
      <div class="uk-inline uk-cal-month-dropdown">
        <button class="uk-input-fake uk-form-sm" type="button">
          ${info.monthName}
        </button>
        <div class="uk-drop uk-dropdown" data-uk-dropdown="mode: click;">
          <ul class="uk-dropdown-nav uk-nav">
            ${months.map(
              (_, b) => html`
                <li
                  class="uk-cal-month-dropdown-item ${b + 1 === info.month
                    ? 'uk-active'
                    : ''}"
                >
                  <a @click="${() => this.selectMonth(b)}">
                    ${months[b]}
                    ${b + 1 === info.month
                      ? html`<span data-uk-check></span>`
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
        @blur="${(e: KeyboardEvent) => {
          const input = e.target as HTMLInputElement;

          input.value = info.year.toString();
        }}"
        @input="${(e: KeyboardEvent) => {
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

  private renderHeader() {
    const info = this.getTimestampComponent(this.$viewDate);

    return html`
      <div class="uk-cal-header">
        <button
          class="uk-btn uk-btn-default uk-btn-sm uk-btn-icon"
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
          class="uk-btn uk-btn-default uk-btn-sm uk-btn-icon"
          @click=${() => this.navigateMonth('next')}
          type="button"
          data-uk-pgn-next
        ></button>
      </div>
    `;
  }

  render() {
    return html`
      <div class="uk-cal ${this.$cls['calendar']}" role="application">
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
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-calendar': Calendar;
  }
}
