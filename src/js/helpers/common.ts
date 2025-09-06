/**
 * Parses a string value into an object or returns the original string.
 * Supports JSON objects and key-value pairs separated by semicolons.
 *
 * @param value - The string to parse
 * @returns Parsed object or original string if no parsing pattern matches
 *
 * @example
 * parseOptions('{"key": "value"}') // Returns: { key: "value" }
 * parseOptions('color: red; size: large') // Returns: { color: "red", size: "large" }
 * parseOptions('simple string') // Returns: "simple string"
 */
export function parseOptions(value: string): object | string {
  // Handle JSON objects
  if (value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('Error parsing JSON:', value, error);

      return {};
    }
  }

  // Handle key-value pairs (e.g., "key1: value1; key2: value2")
  if (value.includes(':')) {
    try {
      const result: Record<string, string> = {};

      value
        .replace(/[;\s]+$/, '') // Remove trailing semicolons and spaces
        .split(';')
        .forEach(pair => {
          const [key, ...valueParts] = pair.trim().split(':');

          if (key && valueParts.length > 0) {
            result[key.trim()] = valueParts.join(':').trim();
          }
        });

      return result;
    } catch (error) {
      console.error('Error parsing key-value pairs:', value, error);

      return {};
    }
  }

  return value;
}

/**
 * Validates a hexadecimal color value.
 *
 * @param hex - The hex color string to validate (e.g., "#FF0000" or "#F00")
 * @returns The validated hex string if valid, undefined otherwise
 *
 * @example
 * validateHex('#FF0000') // Returns: "#FF0000"
 * validateHex('#F00') // Returns: "#F00"
 * validateHex('invalid') // Returns: undefined
 */
export function validateHex(hex: string): string | undefined {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  return hexPattern.test(hex) ? hex : undefined;
}

/**
 * Validates a CSS size value with unit.
 *
 * @param size - The size string to validate (e.g., "10px", "1.5em", "100%")
 * @returns The validated size string if valid, undefined otherwise
 *
 * @example
 * validateSize('10px') // Returns: "10px"
 * validateSize('1.5em') // Returns: "1.5em"
 * validateSize('invalid') // Returns: undefined
 */
export function validateSize(size: string): string | undefined {
  const sizePattern =
    /^(\d*\.?\d+)(px|cm|mm|in|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)$/;

  return sizePattern.test(size) ? size : undefined;
}

/**
 * Validates a CSS border style value.
 *
 * @param style - The border style to validate
 * @returns The validated style string if valid, undefined otherwise
 *
 * @example
 * validateBorderStyle('solid') // Returns: "solid"
 * validateBorderStyle('invalid') // Returns: undefined
 */
export function validateBorderStyle(style: string): string | undefined {
  const validStyles = [
    'none',
    'hidden',
    'dotted',
    'dashed',
    'solid',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
  ];

  return validStyles.includes(style) ? style : undefined;
}

/**
 * Validates a CSS duration value (milliseconds or seconds).
 *
 * @param duration - The duration string to validate (e.g., "500ms", "2s")
 * @returns The validated duration string if valid, undefined otherwise
 *
 * @example
 * validateDuration('500ms') // Returns: "500ms"
 * validateDuration('2.5s') // Returns: "2.5s"
 * validateDuration('invalid') // Returns: undefined
 */
export function validateDuration(duration: string): string | undefined {
  const durationPattern = /^(\d*\.?\d+)(ms|s)$/;

  return durationPattern.test(duration) ? duration : undefined;
}

/**
 * Generates a random alphanumeric ID string.
 *
 * @param length - The length of the ID to generate (default: 5)
 * @returns A random alphanumeric string
 *
 * @example
 * generateId() // Returns: "aBc12" (5 characters)
 * generateId(8) // Returns: "xY9zQ4m2" (8 characters)
 */
export function randomString(length = 5): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length)),
  ).join('');
}

/**
 * Validates and parses a date string in ISO format.
 *
 * @param value - The date string to validate (YYYY-MM-DD or YYYY-MM-DDTHH:MM)
 * @returns A valid Date object
 * @throws Error if the date format is invalid or the date is not valid
 *
 * @example
 * validateDate('2023-12-25') // Returns: Date object for Christmas 2023
 * validateDate('2023-12-25T15:30') // Returns: Date object with time
 * validateDate('invalid') // Throws: Error
 */
export function validateDate(value: string): Date {
  const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;

  if (!datePattern.test(value)) {
    throw new Error(
      'Invalid date format. Expected YYYY-MM-DD or YYYY-MM-DDTHH:MM',
    );
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  return date;
}

/**
 * Validates a time string in 24-hour format.
 *
 * @param value - The time string to validate (HH:MM format)
 * @returns The validated time string
 * @throws Error if the time format is invalid
 *
 * @example
 * validateTime('14:30') // Returns: "14:30"
 * validateTime('25:00') // Throws: Error
 * validateTime('invalid') // Throws: Error
 */
export function validateTime(value: string): string {
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timePattern.test(value)) {
    throw new Error('Invalid time format. Use HH:MM (24-hour format)');
  }

  return value;
}

/**
 * Locale configuration for date formatting.
 */
export interface DateLocales {
  months: string[];
  weekdays: string[];
}

/**
 * Formats a date according to the specified format string and locale.
 *
 * @param date - The Date object to format
 * @param format - The format string with tokens (e.g., "YYYY-MM-DD", "MMM Do, YYYY")
 * @param locales - Locale configuration with month and weekday names
 * @returns The formatted date string
 *
 * @example
 * const date = new Date('2023-12-25T15:30:00');
 * const locales = {
 *   months: ['January', 'February', ...],
 *   weekdays: ['Sunday', 'Monday', ...]
 * };
 *
 * formatDate(date, 'YYYY-MM-DD', locales) // Returns: "2023-12-25"
 * formatDate(date, 'MMM Do, YYYY', locales) // Returns: "Dec 25th, 2023"
 * formatDate(date, 'dddd, MMMM DD', locales) // Returns: "Monday, December 25"
 */
export function formatDate(
  date: Date,
  format: string,
  locales: DateLocales,
): string {
  /**
   * Gets the ordinal suffix for a day number.
   */
  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) {
      return 'th'; // Special case for 11th, 12th, 13th
    }

    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  // Token mapping to formatter functions
  const formatTokens: Record<string, () => string> = {
    // Year tokens
    YYYY: () => date.getFullYear().toString(),
    YY: () => (date.getFullYear() % 100).toString().padStart(2, '0'),

    // Month tokens
    MMMM: () => locales.months[date.getMonth()],
    MMM: () => locales.months[date.getMonth()].substring(0, 3),
    MM: () => (date.getMonth() + 1).toString().padStart(2, '0'),
    M: () => (date.getMonth() + 1).toString(),

    // Day tokens
    dddd: () => locales.weekdays[date.getDay()],
    ddd: () => locales.weekdays[date.getDay()].substring(0, 3),
    Do: () => date.getDate() + getOrdinalSuffix(date.getDate()),
    DD: () => date.getDate().toString().padStart(2, '0'),
    D: () => date.getDate().toString(),

    // Hour tokens (24-hour)
    HH: () => date.getHours().toString().padStart(2, '0'),
    H: () => date.getHours().toString(),

    // Hour tokens (12-hour)
    hh: () => {
      const hour12 = date.getHours() % 12 || 12;

      return hour12.toString().padStart(2, '0');
    },
    h: () => (date.getHours() % 12 || 12).toString(),

    // Minute tokens
    mm: () => date.getMinutes().toString().padStart(2, '0'),
    m: () => date.getMinutes().toString(),

    // AM/PM tokens
    A: () => (date.getHours() >= 12 ? 'PM' : 'AM'),
    a: () => (date.getHours() >= 12 ? 'pm' : 'am'),
  };

  // Create regex pattern from token keys (longest first to avoid partial matches)
  const tokenKeys = Object.keys(formatTokens).sort(
    (a, b) => b.length - a.length,
  );
  const tokenPattern = new RegExp(tokenKeys.join('|'), 'g');

  // Replace all tokens in the format string
  return format.replace(tokenPattern, match => formatTokens[match]());
}

/**
 * Converts a string to title case by capitalizing the first letter of each word.
 *
 * @param str - The string to convert to title case
 * @returns The string in title case format
 *
 * @example
 * titleCase('hello world') // Returns: "Hello World"
 * titleCase('THE QUICK BROWN FOX') // Returns: "The Quick Brown Fox"
 */
export function titleCase(str: string): string {
  return str
    ? str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';
}

/**
 * Converts a date string to a JavaScript Date object in local timezone
 *
 * Supports two formats:
 * - Date only: "YYYY-MM-DD" (e.g., "2024-03-15")
 * - Date with time: "YYYY-MM-DDTHH:MM" (e.g., "2024-03-15T14:30")
 *
 * @param {string} dateString - The date string to parse
 * @returns {Date} A Date object representing the parsed date in local timezone
 */
export function parseDateString(dateString: string): Date {
  if (dateString.includes('T')) {
    // Handle datetime strings (YYYY-MM-DDTHH:MM)
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create date in local timezone
    return new Date(year, month - 1, day, hours, minutes);
  } else {
    // Handle date-only strings (YYYY-MM-DD)
    const [year, month, day] = dateString.split('-').map(Number);

    // Create date in local timezone (not UTC)
    return new Date(year, month - 1, day);
  }
}
