import { type PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Input } from './shared/input';

type Cls = {
  div: string;
};

/**
 * A PIN/OTP input component that creates multiple single-character input fields.
 *
 * @element uk-input-pin
 * @extends {Input}
 *
 * Features:
 * - Configurable length (default 6 digits)
 * - Auto-focus progression between fields
 * - Paste support for full PIN entry
 * - Keyboard navigation (Backspace/Delete)
 * - Form integration via hidden input
 * - Disabled state management
 *
 * @fires uk-input-pin:input - Emitted when the PIN value changes
 *
 * @example
 * ```html
 * <uk-input-pin
 *   name="verification-code"
 *   length="4"
 *   autofocus>
 * </uk-input-pin>
 * ```
 */
@customElement('uk-input-pin')
export class InputPin extends Input {
  /**
   * The default element key used for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the div element.
   */
  protected 'cls-default-element' = 'div';

  /** Custom event name emitted when value changes */
  protected 'input-event' = 'uk-input-pin:input';

  /**
   * Whether to automatically focus the first input field when the component loads.
   *
   * @default false
   * @example
   * ```html
   * <uk-input-pin autofocus></uk-input-pin>
   * ```
   */
  @property({ type: Boolean })
  autofocus: boolean = false;

  /**
   * Number of PIN digits/characters to collect.
   * Determines how many single-character input fields are rendered.
   *
   * @default 6
   * @example
   * ```html
   * <uk-input-pin length="4"></uk-input-pin>
   * ```
   */
  @property({ type: Number })
  length: number = 6;

  /**
   * CSS class configuration for component styling.
   * Allows customization of the container element.
   * @internal
   */
  @state()
  $cls: Cls = {
    div: '',
  };

  /**
   * Index of the currently focused input field.
   * Undefined when no field has focus.
   * @internal
   */
  @state()
  $focus: undefined | number;

  /**
   * Internal PIN value as a concatenated string of all input fields.
   * @internal
   */
  @state()
  $v: string = '';

  /**
   * Returns the current PIN value for form submission and events.
   *
   * @returns The concatenated PIN string
   */
  get $value(): string {
    return this.$v;
  }

  /**
   * Returns a display text representation (not used for PIN inputs).
   * Always returns an empty string.
   *
   * @returns An empty string
   */
  get $text(): string {
    return '';
  }

  /**
   * Collection of all PIN input elements for programmatic access.
   * Used internally for navigation and value updates.
   * @internal
   */
  private HTMLInputs: NodeList | undefined;

  /**
   * Input base class method - PIN component doesn't need initial value setup.
   * The value is built incrementally as user types.
   * @internal
   */
  protected initializeValue(): void {}

  /**
   * Called after the first render to set up input field event handlers.
   * Configures paste functionality for all input fields.
   * @internal
   */
  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.HTMLInputs = this.renderRoot.querySelectorAll('input[type="text"]');

    this.setupPasteHandlers();
  }

  /**
   * Sets up paste event handlers for all PIN input fields.
   * Allows users to paste complete PIN codes which get distributed across fields.
   * @internal
   */
  private setupPasteHandlers(): void {
    this.HTMLInputs?.forEach(input => {
      input.addEventListener('paste', (e: Event) => {
        e.preventDefault();
        const clipboardData = (e as ClipboardEvent).clipboardData;

        if (clipboardData) {
          this.handlePaste(clipboardData.getData('Text'));
        }
      });
    });
  }

  /**
   * Processes pasted text by distributing characters across PIN fields.
   * Enables and focuses appropriate fields, updates the PIN value, and blurs if complete.
   *
   * @param text Pasted text content (trimmed to PIN length)
   * @internal
   */
  private handlePaste(text: string): void {
    const trimmedText = text.substring(0, this.length);
    this.$v = trimmedText;

    // Distribute characters across input fields
    trimmedText.split('').forEach((char, index) => {
      const input = (this.HTMLInputs as NodeList)[index] as HTMLInputElement;
      input.disabled = false;
      input.value = char;
    });

    // Focus next empty field or blur if complete
    if (trimmedText.length < this.length) {
      const nextInput = (this.HTMLInputs as NodeList)[
        trimmedText.length
      ] as HTMLInputElement;
      nextInput.disabled = false;
      nextInput.focus();
    } else {
      const currentInput = (this.HTMLInputs as NodeList)[
        this.$focus as number
      ] as HTMLInputElement;
      currentInput?.blur();
    }

    this.emit();
  }

  /**
   * Handles keyboard navigation between PIN input fields.
   * Manages Backspace (move to previous) and Delete (move to next) behavior.
   *
   * @param e Keyboard event
   * @param input Current input element
   * @internal
   */
  private handleKeyNavigation(e: KeyboardEvent, input: HTMLInputElement): void {
    if (this.$focus === undefined) {
      return;
    }

    switch (e.key) {
      case 'Backspace':
        if (input.value.length === 0 && this.$focus > 0) {
          e.preventDefault();
          const prevInput = (this.HTMLInputs as NodeList)[
            this.$focus - 1
          ] as HTMLInputElement;
          prevInput.focus();
          input.disabled = true;
        }
        break;

      case 'Delete':
        if (input.value.length === 0) {
          e.preventDefault();

          const nextInput = (this.HTMLInputs as NodeList)[
            this.$focus + 1
          ] as HTMLInputElement;

          if (nextInput) {
            nextInput.focus();
            nextInput.setSelectionRange(0, 0);
          }
        }
        break;
    }
  }

  /**
   * Handles input events to manage field progression and value updates.
   * Auto-advances to next field on character entry and emits change event.
   *
   * @param e Input event
   * @param fieldIndex Index of current input field
   * @internal
   */
  private handleInput(e: InputEvent, fieldIndex: number): void {
    const input = e.target as HTMLInputElement;

    // Auto-advance to next field
    if (input.value.length === 1) {
      if (fieldIndex < this.length - 1) {
        const nextInput = (this.HTMLInputs as NodeList)[
          fieldIndex + 1
        ] as HTMLInputElement;

        nextInput.disabled = false;
        nextInput.focus();
      } else {
        // Last field - blur to complete entry
        input.blur();
      }
    }

    // Update PIN value and emit change event
    this.updatePinValue();
    this.emit();
  }

  /**
   * Updates the internal PIN value by concatenating all input field values.
   * @internal
   */
  private updatePinValue(): void {
    let value = '';
    this.HTMLInputs?.forEach(input => {
      value += (input as HTMLInputElement).value;
    });
    this.$v = value;
  }

  /**
   * Renders a single PIN input field with all necessary event handlers.
   *
   * @param index Field index (0-based)
   * @returns Template for the input field
   * @internal
   */
  private renderInput(index: number) {
    return html`
      <input
        type="text"
        maxlength="1"
        placeholder="○"
        .autofocus="${this.autofocus && index === 0}"
        .disabled="${index !== 0}"
        @keydown="${(e: KeyboardEvent) =>
          this.handleKeyNavigation(e, e.target as HTMLInputElement)}"
        @input="${(e: InputEvent) => this.handleInput(e, index)}"
        @focus="${() => (this.$focus = index)}"
        @blur="${() => (this.$focus = undefined)}"
      />
    `;
  }

  /**
   * Renders the complete PIN input component, including all input fields and hidden form input.
   *
   * @returns Template for the component
   */
  render() {
    return html`
      <div
        data-host-inner
        class="${this.disabled ? 'uk-disabled' : ''} ${this.$cls['div'] ||
        ''} uk-input-pin"
      >
        ${Array(this.length)
          .fill('')
          .map((_, index) => this.renderInput(index))}
      </div>
      ${this.renderHidden()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-pin': InputPin;
  }
}
