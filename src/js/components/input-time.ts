import { type PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { validateTime } from '../helpers/common';
import { Input } from './shared/input';

type I18N = {
  am: string;
  pm: string;
};

type Cls = {
  input: string;
};

/**
 * A time input component with separate hour/minute fields and AM/PM selector (for 12h clock).
 *
 * @element uk-input-time
 * @extends {Input}
 *
 * Features:
 * - 12-hour format with AM/PM or 24-hour format
 * - Separate hour (1-12 for 12h clock or 0-23 for 24h clock) and minute (0-59) inputs
 * - Auto-current time option
 * - Input validation and formatting
 * - Keyboard navigation
 * - Form integration
 *
 * @fires uk-input-time:input - Emitted when the time value changes
 *
 * @example
 * ```html
 * <uk-input-time
 *   name="appointment-time"
 *   now
 *   required
 *   clock="12h"
 *   autofocus>
 * </uk-input-time>
 * ```
 */
@customElement('uk-input-time')
export class InputTime extends Input {
  /**
   * The default element key for applying CSS classes via `cls-custom`.
   * For this component, it targets the main input element.
   */
  protected 'cls-default-element' = 'input';

  /**
   * Name of the custom event emitted when the time value changes.
   * Used for dispatching input events from this component.
   */
  protected 'input-event' = 'uk-input-time:input';

  /**
   * Automatically focuses the hour input when the component is rendered.
   *
   * @default false
   * @example
   * ```html
   * <uk-input-time autofocus></uk-input-time>
   * ```
   */
  @property({ type: Boolean })
  autofocus: boolean = false;

  /**
   * If true, initializes the input with the current system time.
   *
   * @default false
   * @example
   * ```html
   * <uk-input-time now></uk-input-time>
   * ```
   */
  @property({ type: Boolean })
  now: boolean = false;

  // Commented properties for future implementation
  // @property({ type: String })
  // min: string = '';
  // @property({ type: String })
  // max: string = '';

  /**
   * Internationalization strings for AM/PM labels.
   * Can be customized for localization.
   *
   * @example
   * ```typescript
   * this.$i18n = { am: 'vorm.', pm: 'nachm.' };
   * ```
   * @internal
   */
  @state()
  $i18n: I18N = {
    am: 'am',
    pm: 'pm',
  };

  /**
   * CSS class configuration for component styling.
   * Allows customization of different component parts.
   *
   * @internal
   */
  @state()
  $cls: Cls = {
    input: '',
  };

  /**
   * Hour value (1-12 or 0-23, depending on the clock). Undefined if not set.
   *
   * @internal
   */
  @state()
  $hour: number | undefined;

  /**
   * Minute value (0-59).
   *
   * @internal
   */
  @state()
  $min: number = 0;

  /**
   * AM/PM indicator for the selected time.
   *
   * @internal
   */
  @state()
  $meridiem: 'am' | 'pm' = 'am';

  /**
   * Clock format, either '12h' or '24h'.
   * @default '12h'
   * @example
   * ```html
   * <uk-input-time clock="12h"></uk-input-time>
   * ```
   */
  @property({ type: String })
  clock: '12h' | '24h' = '12h';

  /**
   * Returns the hour as a zero-padded string (e.g., '09').
   *
   * @returns Zero-padded hour string
   */
  get $HH(): string {
    return this.$hour ? this.$hour.toString().padStart(2, '0') : '00';
  }

  /**
   * Returns the minute as a zero-padded string (e.g., '05').
   *
   * @returns Zero-padded minute string
   */
  get $MM(): string {
    return this.$min >= 0 ? this.$min.toString().padStart(2, '0') : '00';
  }

  /**
   * Returns the time in 24-hour format (HH:MM) for form submission.
   * Returns an empty string if hour is not set.
   *
   * @returns Time string in 24-hour format or empty string
   */
  get $value(): string {
    if (this.$hour === undefined || this.$hour === null ) return '';

    let hour = this.$hour;
    if (this.clock === '12h') {
      if (this.$meridiem === 'pm') {
        hour = this.$hour === 12 ? 12 : this.$hour + 12;
      } else {
        hour = this.$hour === 12 ? 0 : this.$hour;
      }
    }

    return `${hour.toString().padStart(2, '0')}:${this.$min.toString().padStart(2, '0')}`;
  }

  /**
   * Returns a display text representation. Not used for time inputs.
   *
   * @returns An empty string
   */
  get $text(): string {
    return '';
  }

  /**
   * Initializes component value from the initial value property.
   * Initializes time value from property or current time.
   *
   * @protected
   */
  protected initializeValue(): void {
    if (this.value) {
      this.parseTimeValue();
    } else if (this.now) {
      this.setCurrentTime();
    }
  }

  /**
   * Emits a change event when any time component (hour, minute, meridiem) updates.
   *
   * @param _changedProperties Changed properties
   * @protected
   */
  protected updated(_changedProperties: PropertyValues): void {
    if (
      ['$hour', '$min', '$meridiem'].some(property =>
        _changedProperties.has(property),
      )
    ) {
      this.emit();
    }
  }

  /**
   * Parses the initial time value from a string in HH:MM format.
   * Sets hour, minute, and meridiem accordingly.
   *
   * @internal
   */
  private parseTimeValue(): void {
    try {
      const validatedTime = validateTime(this.value);
      const [hours, minutes] = validatedTime.split(':').map(Number);

      if (this.clock === '12h') {
        this.$hour = hours % 12 || 12;
      } else {
        this.$hour = hours;
      }

      this.$min = minutes;
      this.$meridiem = hours < 12 ? 'am' : 'pm';
    } catch (error) {
      console.error('Invalid time format:', error);
    }
  }

  /**
   * Sets the time to the current system time (hour, minute, meridiem).
   *
   * @internal
   */
  private setCurrentTime(): void {
    const date = new Date();

    if (this.clock === '12h') {
      this.$hour = date.getHours() % 12 || 12;
    } else {
      this.$hour = date.getHours();
    }

    this.$min = date.getMinutes();
    this.$meridiem = date.getHours() < 12 ? 'am' : 'pm';
  }

  /**
   * Handles input events for hour and minute fields, updating state accordingly.
   * Only numeric input is allowed, and values are clamped to valid ranges.
   *
   * @param e The keyboard event from the input field
   * @param state Indicates whether the hour or minute field is being edited
   * @internal
   */
  private handleInput(e: KeyboardEvent, state: '$hour' | '$min'): void {
    const input = e.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '').substring(0, 2);
    const numValue = parseInt(value);

    switch (state) {
      case '$hour':
        if (this.clock === '12h' && numValue <= 12) {
          this.$hour = numValue;
        } else {
          this.$hour = numValue <= 23 ? numValue : 23;
        }
        break;
      case '$min':
        if (numValue <= 59) {
          this.$min = numValue;
        }
        break;
    }
    input.value = value;
  }

  /**
   * Handles blur events for hour and minute fields, validating and formatting input values.
   *
   * @param e The keyboard event from the input field
   * @param state Indicates whether the hour or minute field is being blurred
   * @internal
   */
  private handleBlur(e: KeyboardEvent, state: '$hour' | '$min'): void {
    const input = e.target as HTMLInputElement;
    const numValue = parseInt(input.value);

    switch (state) {
      case '$hour':
        if (input.value === '') {
          if (!this.required) {
            this.$hour = undefined;
          } else {
            input.value = this.$HH;
          }
          return;
        }

        if (this.clock === '12h' && numValue > 12) {
          this.$hour = 12;
          input.value = '12';
        } else {
          input.value = this.$HH;
        }
        break;

      case '$min':
        if (numValue > 59) {
          this.$min = 59;
        }
        input.value = this.$MM;
        break;
    }
  }

  /**
   * Handles keydown events for special navigation and value restrictions.
   * Prevents decrementing below zero for minutes.
   *
   * @param e The keyboard event from the input field
   * @param state Indicates whether the hour or minute field is being edited
   * @internal
   */
  private handleKeydown(e: KeyboardEvent, state: '$hour' | '$min'): void {
    if (state === '$min' && e.key === 'ArrowDown' && this.$min === 0) {
      e.preventDefault();
    }
  }

  /**
   * Toggles the AM/PM meridiem value.
   *
   * @internal
   */
  private toggleMeridiem(): void {
    this.$meridiem = this.$meridiem === 'am' ? 'pm' : 'am';
  }

  /**
   * Renders an input field for either hour or minute.
   *
   * @param options Configuration for the input field (min, max, state, key)
   * @returns Rendered input template for hour or minute
   * @internal
   */
  private renderInput(options: {
    min: number;
    max: number;
    state: '$hour' | '$min';
    key: '$HH' | '$MM';
  }) {
    const { min, max, state, key } = options;

    const value =
      state === '$hour'
        ? this.$hour !== undefined
          ? this.$hour.toString().padStart(2, '0')
          : ''
        : this.$hour === undefined
          ? ''
          : this.$min > 0
            ? this.$min.toString().padStart(2, '0')
            : '00';

    return html`
      <input
        data-key="${key}"
        class="${this.$cls.input || ''} uk-input"
        type="number"
        min="${min}"
        max="${max}"
        step="1"
        placeholder="${state === '$hour' ? '09' : '00'}"
        maxlength="2"
        value="${value}"
        .autofocus="${state === '$hour' && this.autofocus}"
        .disabled="${this.disabled ||
        (state !== '$hour' && this.$hour === undefined)}"
        @keydown="${(e: KeyboardEvent) => this.handleKeydown(e, state)}"
        @input="${(e: KeyboardEvent) => this.handleInput(e, state)}"
        @blur="${(e: KeyboardEvent) => this.handleBlur(e, state)}"
      />
    `;
  }

  /**
   * Renders the complete time input component, including hour, minute, and AM/PM selector.
   *
   * @returns Rendered template for the time input component
   * @example
   * ```html
   * <uk-input-time name="meeting" now></uk-input-time>
   * ```
   */
  render() {
    let clockButtonHTML = html``;

    if (this.clock === '12h') {
      clockButtonHTML = html`
        <button
          data-key="meridiem"
          class="${this.$cls.input || ''} uk-input-fake"
          type="button"
          .disabled="${this.disabled || this.$hour === undefined}"
          @click="${(e: MouseEvent) => {
            e.preventDefault();
            this.toggleMeridiem();
          }}"
          @keydown="${(e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              this.toggleMeridiem();
            }
          }}"
        >
          ${this.$locales[this.$meridiem]}
        </button>
      `;
    }

    return html`
      <div data-host-inner class="uk-input-time">
        ${this.renderInput({
          min: this.clock === '12h' ? 1 : 0,
          max: this.clock === '12h' ? 12 : 23,
          state: '$hour',
          key: '$HH',
        })}
        <span>&colon;</span>
        ${this.renderInput({
          min: 0,
          max: 59,
          state: '$min',
          key: '$MM',
        })}
        ${clockButtonHTML}
        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-time': InputTime;
  }
}
