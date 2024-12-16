import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { validateDate } from '../helpers/common';
import { repeat } from 'lit/directives/repeat.js';

type I18N = {
  weekdays: string;
};

type Day = {
  date: number;
  month: string;
  isCurrent: boolean;
  isDisabled: boolean;
  ISOString: string;
};

@customElement('uk-calendar')
export class Calendar extends LitElement {
  @property({ type: Number })
  'starts-with': number = 0;

  @property({ type: String })
  'disabled-dates': string = '';

  @property({ type: String })
  i18n: string = '';

  @state()
  $i18n: I18N = {
    weekdays: 'Su,Mo,Tu,We,Th,Fr,Sa',
  };

  get cal() {
    const { year, month, day } = {
      year: 2025,
      month: 2,
      day: 22,
    };

    const disabledDates: string[] =
      this['disabled-dates'] !== ''
        ? this['disabled-dates']
            .split(',')
            .filter(a => a !== '')
            .map(a => {
              try {
                const date = validateDate(a);

                return date.toISOString().slice(0, 10);
              } catch (e) {
                console.error(`${a} has an invalid format.`);

                return '';
              }
            })
            .filter(a => a !== '')
        : [];

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
    let currentWeek: Day[] = [];

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
          isDisabled: disabledDates.includes(ISOString.slice(0, 10)),
          ISOString: ISOString,
        });
      }

      calendar.push(currentWeek);

      if (date > daysInCurrentMonth && currentWeek[6].month === 'next') break;
    }

    return calendar;
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private renderWeek(i: Day[]) {
    return html`
      <tr>
        ${repeat(
          i,
          _ => _,
          i => this.renderDay(i),
        )}
      </tr>
    `;
  }

  private renderDay(i: Day) {
    return html`
      <td
        class="${i.month !== 'current' ? 'uk-cal-oom' : ''} ${i.isCurrent ===
        true
          ? 'uk-active'
          : ''}"
      >
        <button>${i.date}</button>
      </td>
    `;
  }

  render() {
    const weekdays: any[] = this.$i18n['weekdays'].split(',');

    if (this['starts-with'] === 1) {
      weekdays.push(weekdays.shift());
    }

    return html`
      <div class="uk-cal">
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
              this.cal,
              ([key]) => key,
              i => this.renderWeek(i),
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-calendar': Calendar;
  }
}
