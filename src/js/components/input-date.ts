import { html, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { formatDate, validateDate, type DateLocales } from '../helpers/common';
import { BaseCalendar } from './shared/base-calendar';

/**
 * CSS class names interface for styling different parts of the date input component.
 */
interface Cls extends Record<string, string> {
  /** CSS classes for the main trigger button. */
  button: string;
  /** CSS classes for the calendar icon. */
  icon: string;
  /** CSS classes for the dropdown container. */
  dropdown: string;
  /** CSS classes for the calendar component. */
  calendar: string;
  /** CSS classes for the time input section. */
  time: string;
}

/**
 * A comprehensive date input component with optional time selection.
 *
 * @element uk-input-date
 * @extends {BaseCalendar}
 *
 * Features:
 * - Date selection via dropdown calendar
 * - Optional time input with customizable requirement
 * - Flexible date formatting for display
 * - Icon support (default calendar icon or custom icons)
 * - Full accessibility and keyboard navigation
 * - Integration with UIKit dropdown system
 *
 * @fires uk-input-date:input - Emitted when the date/time value changes
 *
 * @example
 * ```html
 * <!-- Basic date input -->
 * <uk-input-date></uk-input-date>
 *
 * <!-- Date with time -->
 * <uk-input-date with-time require-time></uk-input-date>
 *
 * <!-- Custom format and icon -->
 * <uk-input-date
 *   display-format="DD/MM/YYYY"
 *   icon="calendar"
 *   placeholder="Choose date">
 * </uk-input-date>
 * ```
 *
 */
@customElement('uk-input-date')
export class InputDate extends BaseCalendar {
  /**
   * The default element key used for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the button element.
   */
  protected 'cls-default-element' = 'button';

  /**
   * Custom event name emitted when the value changes.
   * Used for dispatching input events from this component.
   */
  protected 'input-event' = 'uk-input-date:input';

  /**
   * Format string for displaying the selected date.
   * Uses date-fns format tokens.
   *
   * @default "MMMM DD, YYYY"
   * @example
   * "DD/MM/YYYY", "MMM D, YYYY", "YYYY-MM-DD"
   */
  @property({ type: String })
  'display-format': string = 'MMMM DD, YYYY';

  /**
   * Whether to include time selection alongside date.
   * When true, displays a time input below the calendar.
   *
   * @default false
   */
  @property({ type: Boolean })
  'with-time': boolean = false;

  /**
   * Whether time selection is required when with-time is enabled.
   * Only applies when with-time is true.
   *
   * @default false
   */
  @property({ type: Boolean })
  'require-time': boolean = false;

  /**
   * UIKit dropdown configuration string.
   * Controls dropdown behavior and positioning.
   *
   * @default "mode: click"
   * @see https://getuikit.com/docs/dropdown
   */
  @property({ type: String })
  drop: string = 'mode: click; animation: uk-anmt-slide-top-sm;';

  /**
   * Custom icon name for the trigger button.
   * When empty and icon attribute is present, uses default calendar icon.
   *
   * @default ""
   * @example
   * "calendar", "date", "clock"
   */
  @property({ type: String })
  icon: string = '';

  /**
   * Internal date value in YYYY-MM-DD format.
   * Synced with the calendar component selection.
   * @internal
   */
  @state()
  private $date: string | undefined;

  /**
   * Internal time value in HH:MM format.
   * Synced with the time input component.
   * @internal
   */
  @state()
  private $time: string | undefined;

  /**
   * Working date value during user interaction.
   * Used for real-time updates before committing.
   * @internal
   */
  @state()
  private $d: string | undefined;

  /**
   * Working time value during user interaction.
   * Used for real-time updates before committing.
   * @internal
   */
  @state()
  private $t: string | undefined;

  /**
   * CSS class configuration for component styling.
   * Allows customization of different component parts.
   * @internal
   */
  @state()
  protected $cls: Cls = {
    button: '',
    icon: '',
    dropdown: 'uk-datepicker-dropdown',
    calendar: '',
    time: '',
  };

  /**
   * Icon configuration state.
   * Tracks whether to show default icon, custom icon, or no icon.
   * @internal
   */
  private _icon: boolean | string = false;

  /**
   * Gets the complete ISO datetime value combining date and time.
   * Returns the formatted datetime string for form submission.
   *
   * @returns ISO datetime string (YYYY-MM-DDTHH:MM) or date string (YYYY-MM-DD) or empty string
   * @protected
   */
  protected get $value(): string {
    if (this.$d && this.$t) {
      return `${this.$d}T${this.$t}`;
    }

    if (this.$d) {
      return this.$d;
    }

    return '';
  }

  /**
   * Gets the display text for the trigger button.
   * Shows formatted date, placeholder, or default text based on state.
   *
   * @returns Display text for the button
   */
  get $text(): string {
    if (this.$value !== '') {
      return formatDate(
        new Date(this.$value),
        this['display-format'],
        this.$locales as unknown as DateLocales,
      );
    }

    if (this.placeholder) {
      return this.placeholder;
    }

    let text = 'Select a date';

    if (this['with-time'] === true) {
      text += ' and time';
    }

    return text;
  }

  /**
   * Called when the element is added to the DOM.
   * Initializes icon configuration from attributes.
   * @override
   */
  connectedCallback(): void {
    super.connectedCallback();

    if (this.hasAttribute('icon')) {
      const icon = this.getAttribute('icon');
      this._icon = icon === '' ? true : (icon as string);
    }
  }

  /**
   * Called after the first render to set up event listeners.
   * Connects calendar and time input change events.
   *
   * @param _changedProperties - Properties that changed in this update
   * @override
   */
  protected firstUpdated(_changedProperties: PropertyValues): void {
    // Listen for calendar date selection changes
    this.renderRoot
      .querySelector('uk-calendar')
      ?.addEventListener('uk-calendar:change', (e: any) => {
        this.$d = e.detail.value;
      });

    // Listen for time input changes if time selection is enabled
    if (this['with-time'] === true) {
      this.renderRoot
        .querySelector('uk-input-time')
        ?.addEventListener('uk-input-time:input', (e: any) => {
          this.$t = e.detail.value;
        });
    }
  }

  /**
   * Initializes component value from the initial value property.
   * Parses ISO datetime strings into separate date and time components.
   *
   * @protected
   * @override
   */
  protected initializeValue(): void {
    if (this.value) {
      try {
        const date = validateDate(this.value);
        const hours = date.getHours();
        const minutes = date.getMinutes();

        this.$date = date.toISOString().slice(0, 10);
        this.$time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error('Failed to initialize date value:', error);
      }
    }
  }

  /**
   * Renders the complete date input component.
   * Includes trigger button, dropdown with calendar, and optional time input.
   *
   * @returns Template result for the component
   */
  render() {
    return html`
      <div data-host-inner class="uk-datepicker">
        <div class="uk-position-relative">
          <!-- Trigger Button -->
          <button
            class="${this.$cls['button']}"
            type="button"
            .disabled=${this.disabled}
          >
            ${this.$text} ${this._renderIcon()}
          </button>

          <!-- Dropdown Content -->
          <div
            class="${this.$cls['dropdown']} uk-drop"
            data-uk-dropdown="${this.drop}"
          >
            <!-- Calendar Component -->
            <uk-calendar
              .cls-custom="${this.$cls['calendar']}"
              .starts-with="${this['starts-with']}"
              .disabled-dates="${this['disabled-dates']}"
              .marked-dates="${this['marked-dates']}"
              .i18n="${JSON.stringify(this.$i18n)}"
              .view-date="${this['view-date']}"
              .min="${this['min']}"
              .max="${this['max']}"
              .value="${this.$date as string}"
              .today="${this.today}"
              .jumpable="${this.jumpable}"
              .weekday-abbr-length="${this['weekday-abbr-length']}"
            ></uk-calendar>

            <!-- Optional Time Input -->
            ${this._renderTimeInput()}
          </div>
        </div>

        ${this.renderHidden()}
      </div>
    `;
  }

  /**
   * Renders the icon for the trigger button.
   * Supports default calendar icon or custom named icons.
   *
   * @returns Template for the icon or empty string
   * @private
   */
  private _renderIcon() {
    if (this._icon === true) {
      return html`
        <span class="${this.$cls['icon']}" data-uk-calendar-icon></span>
      `;
    }

    if (this.icon !== '') {
      return html`
        <uk-icon class="${this.$cls['icon']}" icon="${this.icon}"></uk-icon>
      `;
    }

    return '';
  }

  /**
   * Renders the time input section when with-time is enabled.
   *
   * @returns Template for time input or empty string
   * @private
   */
  private _renderTimeInput() {
    if (!this['with-time']) {
      return '';
    }

    return html`
      <div class="uk-datepicker-time">
        <uk-input-time
          now
          .cls-custom="${this.$cls['time']}"
          .required=${this['require-time']}
          .i18n="${JSON.stringify(this.$i18n)}"
          .value="${this.$time as string}"
        ></uk-input-time>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-date': InputDate;
  }
}
