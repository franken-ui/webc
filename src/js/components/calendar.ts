import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseOptions, validateDate } from '../helpers/common';
import { repeat } from 'lit/directives/repeat.js';

interface I18N {
  weekdays: string;
  months: string;
}

interface Day {
  date: number;
  month: 'prev' | 'current' | 'next';
  isCurrent: boolean;
  isDisabled: boolean;
  isMarked: boolean;
  ISOString: string;
}

interface TimestampComponent {
  year: number;
  month: number;
  monthName: string;
  day: number;
  dayOfWeek: number;
  dayName: string;
  ISOString: string;
}

@customElement('uk-calendar')
export class Calendar extends LitElement {
  @property({ type: Number })
  'starts-with' = 0;

  @property({ type: String })
  'disabled-dates': string = '';

  @property({ type: String })
  'marked-dates': string = '';

  @property({ type: String })
  name: string = '';

  @property({ type: String })
  i18n: string = '';

  @property({ type: String })
  'view-date': string = new Date().toISOString().split('T')[0];

  @property({ type: String })
  min: string = '';

  @property({ type: String })
  max: string = '';

  @property({ type: String })
  value: string = '';

  @property({ type: Boolean })
  today: boolean = false;

  @property({ type: Boolean })
  jumpable: boolean = false;

  @state()
  private $viewDate: Date = new Date();

  @state()
  private $i18n: I18N = {
    weekdays: 'Su,Mo,Tu,We,Th,Fr,Sa',
    months:
      'January,February,March,April,May,June,July,August,September,October,November,December',
  };

  @state()
  private $active: string | undefined;

  private getUTCDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
  }

  private isDirty = false;

  connectedCallback(): void {
    super.connectedCallback();

    if (this.i18n) {
      const i18n = parseOptions(this.i18n) as I18N;

      if (typeof i18n === 'object') {
        this.$i18n = Object.assign(this.$i18n, i18n);
      }
    }

    if (this.value) {
      try {
        this.$active = validateDate(this.value).toISOString();
      } catch (e) {
        console.error(`${this.value} has an invalid format.`);
      }
    } else {
      if (this.today === true) {
        this.$active = this.getUTCDate(new Date()).toISOString();
      }
    }

    this.$viewDate = new Date(this['view-date']);

    this.addEventListener('keydown', this.navigate);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this.navigate);
  }

  private isDateInRange(date: string): boolean {
    if (!this.min && !this.max) {
      return true;
    }

    const current = new Date(date);

    if (this.min) {
      const minDate = validateDate(this.min);

      if (current < minDate) {
        return false;
      }
    }

    if (this.max) {
      const maxDate = validateDate(this.max);

      if (current > maxDate) {
        return false;
      }
    }

    return true;
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
    const date = new Date(this.$viewDate);

    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
      if (this.min && date < validateDate(this.min)) {
        return;
      }
    } else {
      date.setMonth(date.getMonth() + 1);
      if (this.max && date > validateDate(this.max)) {
        return;
      }
    }

    this.$viewDate = date;
  }

  private selectMonth(month: number) {
    const date = new Date(this.$viewDate);

    date.setMonth(month);

    this.$viewDate = date;
  }

  private setYear(year: string) {
    if (/^\d{4}$/.test(year)) {
      const date = new Date(this.$viewDate);

      date.setFullYear(parseInt(year));

      this.$viewDate = date;
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

  // private getButtonAtPosition(
  //   rowIndex: number,
  //   colIndex: number,
  // ): HTMLButtonElement | undefined {
  //   const row = this.querySelectorAll('tr')[rowIndex];
  //   return row?.children[colIndex]?.querySelector(
  //     'button',
  //   ) as HTMLButtonElement;
  // }

  // private getRowFirstButton(rowIndex: number): HTMLButtonElement | undefined {
  //   const row = this.querySelectorAll('tr')[rowIndex];
  //   return row?.querySelector('button') as HTMLButtonElement;
  // }

  // private getRowLastButton(rowIndex: number): HTMLButtonElement | undefined {
  //   const row = this.querySelectorAll('tr')[rowIndex];
  //   const buttons = row?.querySelectorAll('button');
  //   return buttons?.[buttons.length - 1] as HTMLButtonElement;
  // }

  private select(day: Day): void {
    this.$active = day.ISOString;

    if (day.month !== 'current') {
      this.$viewDate = new Date(day.ISOString);
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
    const weekdays = this.$i18n.weekdays.split(',');

    if (this['starts-with'] === 1) {
      weekdays.push(weekdays.shift()!);
    }

    return weekdays;
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

  private getTimestampComponent(date: Date): TimestampComponent {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1, // 1-12
      monthName: date.toLocaleString('default', { month: 'long' }),
      day: date.getDate(),
      dayOfWeek: date.getDay(), // 0-6
      dayName: date.toLocaleString('default', { weekday: 'long' }),
      ISOString: date.toISOString(),
    };
  }

  private parseDates(dates: string): string[] {
    return dates
      .split(',')
      .filter(Boolean)
      .map(date => {
        try {
          return validateDate(date).toISOString().slice(0, 10);
        } catch (e) {
          console.error(`${date} has an invalid format.`);
          return '';
        }
      })
      .filter(Boolean);
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

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
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

      this.dispatchEvent(
        new CustomEvent(`uk-calendar:change`, {
          detail: {
            value: this.$active?.slice(0, 10),
          },
          bubbles: true,
          composed: true,
        }),
      );
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
    const months = this.$i18n.months.split(',');
    const info = this.getTimestampComponent(this.$viewDate);

    return html`
      <div class="uk-inline uk-cal-month-dropdown">
        <button class="uk-input-fake uk-form-sm" type="button">
          ${info.monthName}
        </button>
        <div class="uk-drop uk-dropdown" data-uk-dropdown="mode: click;">
          <ul class="uk-dropdown-nav uk-nav">
            ${months.map(
              (a, b) => html`
                <li
                  class="uk-cal-month-dropdown-item ${b + 1 === info.month
                    ? 'uk-active'
                    : ''}"
                >
                  <a @click="${() => this.selectMonth(b)}" href="#">
                    ${a}
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
          href="#"
          data-uk-pgn-previous
        ></button>
        <div class="uk-cal-jumper">
          ${this.jumpable === false
            ? html`
                <div class="uk-cal-title uk-text-sm">
                  ${info.monthName} ${info.year}
                </div>
              `
            : this.renderJumper()}
        </div>
        <button
          class="uk-btn uk-btn-default uk-btn-sm uk-btn-icon"
          @click=${() => this.navigateMonth('next')}
          type="button"
          href="#"
          data-uk-pgn-next
        ></button>
      </div>
    `;
  }

  private renderHidden() {
    return this.name
      ? html`<input
          name="${this.name}"
          type="hidden"
          value="${this.$active?.slice(0, 10) as string}"
        />`
      : '';
  }

  render() {
    return html`
      <div class="uk-cal" role="application">
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
