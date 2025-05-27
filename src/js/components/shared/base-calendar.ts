import { property, state } from 'lit/decorators.js';
import { validateDate } from '../../helpers/common';
import { Input } from './input';

/**
 * Abstract base class for calendar-related components.
 *
 * Provides common calendar functionality including:
 * - Date validation and range checking
 * - Internationalization support for weekdays and months
 * - View date management and navigation
 * - Disabled and marked dates handling
 * - UTC date utilities for consistent date handling
 *
 * Extended by concrete calendar implementations like Calendar, InputDate, etc.
 *
 * @abstract
 * @extends Input
 */
export abstract class BaseCalendar extends Input {
  /**
   * Whether to automatically select today's date if no value is provided.
   *
   * @default false
   */
  @property({ type: Boolean })
  today: boolean = false;

  /**
   * Whether to show month/year jump controls for quick navigation.
   *
   * @default false
   */
  @property({ type: Boolean })
  jumpable: boolean = false;

  /**
   * Which day of the week to start with (0 = Sunday, 1 = Monday).
   *
   * @default 0
   */
  @property({ type: Number })
  'starts-with' = 0;

  /**
   * Comma-separated list of dates to disable (YYYY-MM-DD format).
   *
   * @example
   * "2025-12-25,2025-01-01,2025-07-04"
   * @default ""
   */
  @property({ type: String })
  'disabled-dates': string = '';

  /**
   * Comma-separated list of dates to mark with special styling (YYYY-MM-DD format).
   *
   * @example
   * "2025-05-29,2025-06-15,2025-07-20"
   * @default ""
   */
  @property({ type: String })
  'marked-dates': string = '';

  /**
   * The date currently being viewed in the calendar (YYYY-MM-DD format).
   * Controls which month/year is displayed, not the selected date.
   *
   * @default Today's date
   */
  @property({ type: String })
  'view-date': string = new Date().toISOString().split('T')[0];

  /**
   * Minimum selectable date (YYYY-MM-DD format).
   * Dates before this will be disabled.
   *
   * @default ""
   */
  @property({ type: String })
  min: string = '';

  /**
   * Maximum selectable date (YYYY-MM-DD format).
   * Dates after this will be disabled.
   *
   * @default ""
   */
  @property({ type: String })
  max: string = '';

  /**
   * Number of characters to show for weekday abbreviations.
   *
   * @default 3
   * @example
   * 3 = "Mon", 2 = "Mo", 1 = "M"
   */
  @property({ type: Number })
  'weekday-abbr-length': number = 3;

  /**
   * Internationalization data for weekdays and months.
   * Can be overridden via the i18n property.
   *
   * @internal
   */
  @state()
  protected $i18n: {
    [key: string]: string;
  } = {
    weekdays: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    months:
      'January,February,March,April,May,June,July,August,September,October,November,December',
  };

  /**
   * Tracks whether the component's value has been modified by user interaction.
   * Used to determine when to emit change events and manage focus.
   *
   * @internal
   */
  protected isDirty = false;

  /**
   * Gets the current view date as a Date object, normalized to the first day of the month.
   * Ensures consistent month/year display regardless of the specific day.
   *
   * @returns Date object set to the first day of the viewed month.
   */
  protected get $viewDate(): Date {
    const date = new Date(this['view-date']);

    if (date.getDate() !== 1) {
      date.setDate(1);
    }

    return date;
  }

  /**
   * Converts a regular Date to a UTC Date to avoid timezone issues.
   * Ensures consistent date handling across different timezones.
   *
   * @param date - The date to convert to UTC.
   * @returns New Date object in UTC timezone.
   */
  protected getUTCDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
  }

  /**
   * Checks if a date falls within the allowed min/max range.
   *
   * @param date - ISO string of the date to check.
   * @returns True if the date is within the allowed range.
   */
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

  /**
   * Parses a comma-separated string of dates into an array of valid date strings.
   * Filters out invalid dates and normalizes them to YYYY-MM-DD format.
   *
   * @param dates - Comma-separated string of dates.
   * @returns Array of valid date strings in YYYY-MM-DD format.
   */
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

  /**
   * Extracts various components from a Date object for display purposes.
   * Provides both numeric and localized string representations.
   *
   * @param date - The date to extract components from.
   * @returns Object containing various date components and formatted strings.
   */
  protected getTimestampComponent(date: Date): {
    /** Four-digit year */
    year: number;
    /** Month number (1-12) */
    month: number;
    /** Localized month name */
    monthName: string;
    /** Day of month (1-31) */
    day: number;
    /** Day of week (0-6, Sunday = 0) */
    dayOfWeek: number;
    /** Localized day name */
    dayName: string;
    /** Full ISO string representation */
    ISOString: string;
  } {
    const monthNames = this.$locales.months;
    const dayNames = this.$locales.weekdays;

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      monthName: monthNames[date.getMonth()],
      day: date.getDate(),
      dayOfWeek: date.getDay(),
      dayName: dayNames[date.getDay()],
      ISOString: date.toISOString(),
    };
  }

  /**
   * Initializes the component's value from properties or default state.
   * Must be implemented by concrete calendar components to set up their initial state.
   *
   * @abstract
   * @example
   * ```typescript
   * protected initializeValue(): void {
   *   if (this.value) {
   *     this.selectedDate = validateDate(this.value);
   *   } else if (this.today) {
   *     this.selectedDate = new Date();
   *   }
   * }
   * ```
   */
  protected abstract initializeValue(): void;
}
