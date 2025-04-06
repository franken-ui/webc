import { property, state } from 'lit/decorators.js';
import { parseOptions, validateDate } from '../../helpers/common';
import { Input } from './input';

export abstract class BaseCalendar extends Input {
  @property({ type: Boolean })
  today: boolean = false;

  @property({ type: Boolean })
  jumpable: boolean = false;

  @property({ type: Number })
  'starts-with' = 0;

  @property({ type: String })
  'disabled-dates': string = '';

  @property({ type: String })
  'marked-dates': string = '';

  @property({ type: String })
  'view-date': string = new Date().toISOString().split('T')[0];

  @property({ type: String })
  min: string = '';

  @property({ type: String })
  max: string = '';

  @property({ type: Number })
  'weekday-abbr-length': number = 3;

  @state()
  protected $i18n: {
    [key: string]: string;
  } = {
    weekdays: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    months:
      'January,February,March,April,May,June,July,August,September,October,November,December',
  };

  protected isDirty = false;

  protected get $viewDate(): Date {
    const date = new Date(this['view-date']);

    if (date.getDate() !== 1) {
      date.setDate(1);
    }

    return date;
  }

  protected getUTCDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
  }

  protected isDateInRange(date: string): boolean {
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

  protected parseDates(dates: string): string[] {
    return dates
      .split(',')
      .filter(Boolean)
      .map(date => {
        try {
          return validateDate(date.trim()).toISOString().slice(0, 10);
        } catch (e) {
          console.error(`${date} has an invalid format.`);
          return '';
        }
      })
      .filter(Boolean);
  }

  protected getTimestampComponent(date: Date): {
    year: number;
    month: number;
    monthName: string;
    day: number;
    dayOfWeek: number;
    dayName: string;
    ISOString: string;
  } {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      monthName: this.$i18n['months'].split(',')[date.getMonth()],
      // monthName: date.toLocaleString('default', { month: 'long' }),
      day: date.getDate(),
      dayOfWeek: date.getDay(),
      dayName: this.$i18n['weekdays'][date.getMonth()],
      // dayName: date.toLocaleString('default', { weekday: 'long' }),
      ISOString: date.toISOString(),
    };
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.i18n) {
      const i18n = parseOptions(this.i18n);

      if (typeof i18n === 'object') {
        this.$i18n = Object.assign(this.$i18n, i18n);
      }
    }

    this.initializeValue();
  }

  protected abstract initializeValue(): void;
}
