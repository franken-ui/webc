import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseOptions } from '../../helpers/common';
import { repeat } from 'lit/directives/repeat.js';

type I18N = {
  weekdays: string;
};

type TimestampComponent = {
  year: number;
  month: number;
  day: number;
};

@customElement('uk-input-date')
export class InputDate extends LitElement {
  @property({ type: String })
  name: string = '';

  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: String })
  placeholder: string = 'Select a date';

  @property({ type: Boolean })
  error: boolean = false;

  @property({ type: String })
  i18n: string = '';

  @property({ type: Number })
  'starts-with': number = 1;

  @property({ type: String })
  value: string = '';

  @property({ type: String })
  'disabled-dates': string = '';

  @property({ type: Boolean })
  time: boolean = false;

  @state()
  $calendar: any[][] = [];

  @state()
  $isOpen: boolean = false;

  @state()
  $date: string = new Date().toISOString();

  @state()
  $i18n: I18N = {
    weekdays: 'Su,Mo,Tu,We,Th,Fr,Sa',
  };

  @state()
  focused: number = 0;

  @state()
  $shouldRender: boolean = false;

  connectedCallback(): void {
    super.connectedCallback();

    this.initializeDefaults();

    if (this.i18n) {
      this.$i18n = parseOptions(this.i18n) as I18N;
    }

    document.addEventListener('click', this.onClickAway.bind(this));

    this.removeAttribute('uk-cloak');
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener('click', this.onClickAway);
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('$date')) {
      this.updateComplete.then(() => {
        this.$calendar = this.cal(this.getTimestampComponents(this.$date));
      });
    }
  }

  private navigateMonth(direction: 'prev' | 'next') {
    const date = new Date(this.$date);

    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }

    this.$date = date.toISOString();
  }

  render() {
    const weekdays: any[] = this.$i18n['weekdays'].split(',');

    if (this['starts-with'] === 1) {
      weekdays.push(weekdays.shift());
    }

    return this.$shouldRender === true
      ? html`
          <div class="uk-input-date">
            <button @click=${() => this.navigateMonth('prev')}>
              Subtract month
            </button>
            <button @click=${() => this.navigateMonth('next')}>
              Add month
            </button>

            <button
              class="uk-input-date-input ${this.error === true
                ? 'uk-form-danger'
                : ''}"
              type="button"
              .disabled=${this.disabled}
              @click="${this.toggle}"
              @keydown="${(e: KeyboardEvent) => {
                if (this.$isOpen === true) {
                  switch (e.key) {
                  }
                }
              }}"
            >
              ${this.placeholder}
            </button>
            ${this.$isOpen === true
              ? html`<div
                class="uk-drop uk-dropdown uk-open"
                tabindex="-1"
              >
              <div class="uk-calendar">
                <table>
                  <thead>
                    <tr>
                      ${repeat(
                        weekdays,
                        ([key]) => key,
                        i => html`<th>${i}</th>`,
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    ${repeat(
                      this.$calendar,
                      ([key]) => key,
                      i =>
                        html`<tr>
                          ${repeat(
                            i,
                            _ => _,
                            i =>
                              html`<td
                                class="${i.month !== 'current'
                                  ? 'uk-calendar-oom'
                                  : ''} ${i.isCurrentDay === true
                                  ? 'uk-active'
                                  : ''}"
                              >
                                <button>${i.date}</button>
                              </td>`,
                          )}
                        </tr>`,
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              </div>`
              : ''}
          </div>
        `
      : '';
  }

  private initializeDefaults() {
    try {
      if (this.hasAttribute('value') && this.value !== '') {
      }
    } catch (e) {
      return console.error(e);
    }

    this.$shouldRender = true;
  }

  private validateDate(value: string) {
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value)) {
      let date = new Date(value);

      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      return date;
    }

    throw new Error('Invalid format');
  }

  private toggle() {
    this.$isOpen = !this.$isOpen;
  }

  private getTimestampComponents(date: string): TimestampComponent {
    const _date = new Date(date);

    const year: number = _date.getFullYear();
    const month: number = parseInt(
      (_date.getMonth() + 1).toString().padStart(2, '0'),
    );
    const day: number = _date.getDate();

    return {
      year,
      month,
      day,
    };
  }

  private cal(options: { [key: string]: any }) {
    const { year, month, day } = options;

    const disabledDates: string[] =
      this['disabled-dates'] !== ''
        ? this['disabled-dates']
            .split(',')
            .filter(a => a !== '')
            .map(a => {
              try {
                const date = this.validateDate(a);

                return date.toISOString().slice(0, 10);
              } catch (e) {
                console.error(`${a} has an invalid format.`);

                return '';
              }
            })
            .filter(a => a !== '')
        : [];

    console.log(disabledDates);

    // Create Date objects for the current, previous, and next months
    const currentMonth = new Date(year, month - 1, 1);

    // Get the number of days in each month
    const daysInCurrentMonth = new Date(year, month, 0).getDate();
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

    // Get the day of the week for the first day of the current month (0-6)
    let startingDay = currentMonth.getDay();

    // Adjust startingDay based on this['starts-with']
    startingDay = (startingDay - this['starts-with'] + 7) % 7;

    // Initialize the calendar array
    const calendar = [];

    let date = 1;
    let currentWeek = [];

    // Calculate the starting date from the previous month
    let prevMonthStartDate = daysInPrevMonth - startingDay + 1;

    for (let i = 0; i < 6; i++) {
      currentWeek = [];

      for (let j = 0; j < 7; j++) {
        let currentDate: number;
        let monthOffset: number;

        if (i === 0 && j < startingDay) {
          // Previous month days
          currentDate = prevMonthStartDate;
          monthOffset = -1;
          prevMonthStartDate++;
        } else if (date > daysInCurrentMonth) {
          // Next month days
          currentDate = date - daysInCurrentMonth;
          monthOffset = 1;
          date++;
        } else {
          // Current month days
          currentDate = date;
          monthOffset = 0;
          date++;
        }

        const fullDate = new Date(year, month - 1 + monthOffset, currentDate);
        const ISOString = fullDate.toISOString();

        currentWeek.push({
          date: currentDate,
          month:
            monthOffset === -1
              ? 'prev'
              : monthOffset === 1
                ? 'next'
                : 'current',
          isCurrent: currentDate === day && monthOffset === 0,
          isActive: ISOString.slice(0, 10) === this.value.slice(0, 10),
          isDisabled: disabledDates.includes(ISOString.slice(0, 10)),
          ISOString: ISOString,
        });
      }

      calendar.push(currentWeek);

      if (date > daysInCurrentMonth && currentWeek[6].month === 'next') break;
    }

    return calendar;
  }

  private onClickAway(e: any) {
    if (this.$isOpen && !this.renderRoot.contains(e.target)) {
      this.$isOpen = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-date': InputDate;
  }
}
