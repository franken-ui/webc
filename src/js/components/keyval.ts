import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Base } from './shared/base';
import { type OptionGrouped, selectToObject } from '../helpers/select';
import { randomString } from '../helpers/common';

/**
 * CSS class names for styling different parts of the key-value component.
 * Can be customized via the `cls-custom` property.
 *
 * @property table   CSS class for the table element.
 * @property input   CSS class for input elements.
 * @property button  CSS class for button elements.
 */
type Cls = {
  table: string;
  input: string;
  button: string;
};

/**
 * Internationalization strings for component localization.
 * Allows customizing UI text for different languages.
 *
 * @property header-key         Header text for the key column.
 * @property header-value       Header text for the value column.
 * @property placeholder-key    Placeholder for key input fields.
 * @property placeholder-value  Placeholder for value input fields.
 */
type I18N = {
  'header-key': string;
  'header-value': string;
  'placeholder-key': string;
  'placeholder-value': string;
};

/**
 * A dynamic key-value table component supporting advanced features:
 * - Dynamic row addition/removal
 * - Password masking and visibility toggle for sensitive values
 * - Integration with a child <select> for form-driven options
 * - Reactive updates from external changes
 * - Maximum row limits and random value generation
 *
 * @element uk-keyval
 * @extends {Base}
 *
 * @example
 * Basic usage:
 * ```html
 * <uk-keyval></uk-keyval>
 * ```
 *
 * With password masking and max rows:
 * ```html
 * <uk-keyval sensitive max="5"></uk-keyval>
 * ```
 *
 * With form integration:
 * ```html
 * <uk-keyval reactive>
 *   <select>
 *     <option value="value1" data-key="key1">Display Text</option>
 *   </select>
 * </uk-keyval>
 * ```
 */
@customElement('uk-keyval')
export class Keyval extends Base {
  /**
   * The default element key for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the div element.
   */
  protected 'cls-default-element' = 'div';

  /**
   * Comma-separated list of default keys to populate the table.
   *
   * @example
   * ```html
   * <uk-keyval keys="api_key,secret_key,token"></uk-keyval>
   * ```
   */
  @property({ type: String })
  keys: string = '';

  /**
   * Comma-separated list of default values corresponding to keys.
   *
   * @example
   * ```html
   * <uk-keyval values="abc123,def456,ghi789"></uk-keyval>
   * ```
   */
  @property({ type: String })
  values: string = '';

  /**
   * Enables reactive monitoring of a child <select> element.
   * When true, the component updates automatically when the select element changes.
   *
   * @default false
   */
  @property({ type: Boolean })
  reactive: boolean = false;

  /**
   * Enables password masking and visibility toggle for value fields.
   * When true, values are masked and include visibility toggle and random generation buttons.
   *
   * @default false
   */
  @property({ type: Boolean })
  sensitive: boolean = false;

  /**
   * Disables the ability to add new rows.
   * When true, the add button is hidden and users cannot insert new key-value pairs.
   *
   * @default false
   */
  @property({ type: Boolean })
  noninsertable: boolean = false;

  /**
   * Maximum number of rows allowed. When set to 0, there is no limit.
   * If set to a positive number, the add button is disabled once this limit is reached.
   *
   * @default 0
   */
  @property({ type: Number })
  max: number = 0;

  /**
   * CSS class configuration for component elements.
   * Allows customization of table, input, and button classes.
   * @internal
   */
  @state()
  $cls: Cls = {
    table: '',
    input: '',
    button: '',
  };

  /**
   * Internationalization strings for UI text.
   * Can be customized for localization.
   * @internal
   */
  @state()
  $i18n: I18N = {
    'header-key': 'Key',
    'header-value': 'Value',
    'placeholder-key': 'Key',
    'placeholder-value': 'Value',
  };

  /**
   * Tracks password visibility state for each row when sensitive mode is enabled.
   * Key is the row index, value is a boolean indicating if the password is visible.
   * @internal
   */
  @state()
  protected valueVisibility: { [key: number]: boolean } = {};

  /**
   * Reference to the child <select> element for form integration.
   * @internal
   */
  protected HTMLSelect: HTMLSelectElement | null = null;

  /**
   * MutationObserver for monitoring changes to the select element when reactive mode is enabled.
   * @internal
   */
  protected observer: MutationObserver | null = null;

  /**
   * Internal data structure representing the key-value pairs.
   * Uses OptionGrouped format for compatibility with select element integration.
   * @internal
   */
  protected _options: OptionGrouped = {};

  /**
   * Lit lifecycle method called when the element is added to the DOM.
   * Initializes select element integration, reactive observation, and default data structures.
   * @override
   */
  connectedCallback(): void {
    super.connectedCallback();

    this.HTMLSelect = this.renderRoot.querySelector('select');

    if (this.HTMLSelect) {
      this.createOptions();

      if (this.reactive) {
        this.setupReactiveObserver();
      }
    } else {
      this.initializeEmptyOptions();
      this.addRow();
    }

    this.initializePasswordVisibility();
  }

  /**
   * Sets up MutationObserver for reactive monitoring of select element changes.
   * @private
   */
  private setupReactiveObserver(): void {
    this.observer = new MutationObserver(() => {
      this.createOptions();
      this.requestUpdate();
    });

    this.observer.observe(this.HTMLSelect!, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  /**
   * Initializes empty options structure when no select element is present.
   * @private
   */
  private initializeEmptyOptions(): void {
    this._options = {
      __: {
        text: '__',
        options: [],
      },
    };
  }

  /**
   * Initializes password visibility state for all rows when sensitive mode is enabled.
   * @private
   */
  private initializePasswordVisibility(): void {
    if (this.sensitive && this._options.__ && this._options.__.options) {
      this._options.__.options.forEach((_, index) => {
        this.valueVisibility[index] = false;
      });
    }
  }

  /**
   * Creates or updates the internal options structure from the select element.
   * Only processes if reactive mode is enabled or component hasn't been rendered yet.
   * @protected
   */
  protected createOptions(): void {
    if (this.reactive === false && this.isRendered === true) {
      return;
    }

    if (this.HTMLSelect) {
      this._options = selectToObject(this.HTMLSelect);

      // Ensure we have at least one empty row if no options were found
      if (
        !this._options.__ ||
        !this._options.__.options ||
        this._options.__.options.length === 0
      ) {
        this.initializeEmptyOptions();
        this.addRow();
      }
    }
  }

  /**
   * Adds a new empty row to the key-value table.
   * Initializes the row with empty key and value, and sets up password visibility if needed.
   * @protected
   */
  protected addRow(): void {
    if (!this._options.__) {
      this.initializeEmptyOptions();
    }

    const newIndex = this._options.__.options.length;

    this._options.__.options.push({
      group: '__',
      value: '',
      text: '',
      disabled: false,
      selected: false,
      data: { gid: '' },
    });

    // Initialize visibility for new row based on sensitive setting
    if (this.sensitive) {
      this.valueVisibility[newIndex] = false;
    }

    this.requestUpdate();
  }

  /**
   * Removes a row from the key-value table at the specified index.
   * Prevents removal if only one row remains and reindexes visibility tracking.
   *
   * @param index The zero-based index of the row to remove.
   * @protected
   */
  protected removeRow(index: number): void {
    if (
      this._options.__ &&
      this._options.__.options &&
      this._options.__.options.length > 1
    ) {
      this._options.__.options.splice(index, 1);
      this.reindexVisibilityAfterRemoval(index);
      this.requestUpdate();
    }
  }

  /**
   * Reindexes the password visibility tracking object after a row is removed.
   * Shifts all indices greater than the removed index down by one.
   *
   * @param removedIndex The index of the removed row.
   * @private
   */
  private reindexVisibilityAfterRemoval(removedIndex: number): void {
    const newVisibility: { [key: number]: boolean } = {};

    Object.keys(this.valueVisibility).forEach(key => {
      const numKey = parseInt(key);
      if (numKey < removedIndex) {
        newVisibility[numKey] = this.valueVisibility[numKey];
      } else if (numKey > removedIndex) {
        newVisibility[numKey - 1] = this.valueVisibility[numKey];
      }
    });

    this.valueVisibility = newVisibility;
  }

  /**
   * Handles changes to the key input field for a specific row.
   * Updates the internal data structure and triggers a re-render.
   *
   * @param index The zero-based index of the row being modified.
   * @param event The input event containing the new key value.
   * @protected
   */
  protected handleKeyChange(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const keyValue = inputElement.value;

    if (this._options.__ && this._options.__.options[index]) {
      this._options.__.options[index].data.gid = keyValue;
      this.requestUpdate();
    }
  }

  /**
   * Handles changes to the value input field for a specific row.
   * Updates the internal data structure and triggers a re-render.
   *
   * @param index The zero-based index of the row being modified.
   * @param event The input event containing the new value.
   * @protected
   */
  protected handleValueChange(index: number, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    if (this._options.__ && this._options.__.options[index]) {
      this._options.__.options[index].value = value;
      this.requestUpdate();
    }
  }

  /**
   * Generates and sets a random value for the specified row.
   * Uses a 16-character random ID. Only available in sensitive mode.
   *
   * @param index The zero-based index of the row to update.
   * @protected
   */
  protected setRandomValue(index: number): void {
    if (this._options.__ && this._options.__.options[index]) {
      this._options.__.options[index].value = randomString(16);
      this.requestUpdate();
    }
  }

  /**
   * Toggles the password visibility for a specific row.
   * Only functional when sensitive mode is enabled.
   *
   * @param index The zero-based index of the row to toggle.
   * @protected
   */
  protected togglePasswordVisibility(index: number): void {
    if (this.sensitive) {
      this.valueVisibility[index] = !this.valueVisibility[index];
      this.requestUpdate();
    }
  }

  /**
   * Gets the current password visibility state for a specific row.
   *
   * @param index The zero-based index of the row to check.
   * @returns True if the password is currently visible, false otherwise.
   * @protected
   */
  protected getPasswordVisibility(index: number): boolean {
    return this.valueVisibility[index] || false;
  }

  /**
   * Determines the appropriate input type for a value field based on sensitivity and visibility.
   *
   * @param index The zero-based index of the row.
   * @returns 'password' for hidden sensitive fields, 'text' otherwise.
   * @protected
   */
  protected getInputType(index: number): 'text' | 'password' {
    if (!this.sensitive) {
      return 'text';
    }

    return this.getPasswordVisibility(index) ? 'text' : 'password';
  }

  /**
   * Internal icon repository for the component.
   *
   * Returns SVG icons as Lit HTML templates for consistent rendering across the component.
   * Icons are defined inline to avoid external dependencies and ensure reliability.
   *
   * @param icon - The name of the icon to retrieve.
   * @returns A Lit HTML template containing the requested SVG icon.
   *
   * @example
   * Usage in a render method:
   * ```typescript
   * render() {
   *   return html`
   *     <button>${this.$icons('plus')} Save</button>
   *   `;
   * }
   * ```
   */
  protected $icons(icon: string) {
    switch (icon) {
      case 'plus':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        `;
      case 'wand':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M15 4V2" />
            <path d="M15 16v-2" />
            <path d="M8 9h2" />
            <path d="M20 9h2" />
            <path d="M17.8 11.8 19 13" />
            <path d="M15 9h.01" />
            <path d="M17.8 6.2 19 5" />
            <path d="m3 21 9-9" />
            <path d="M12.2 6.2 11 5" />
          </svg>
        `;
      case 'eye-off':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
            />
            <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
            <path
              d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
            />
            <path d="m2 2 20 20" />
          </svg>
        `;
      case 'eye':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
        `;
      case 'trash-2':
        return html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </svg>
        `;
    }
  }

  /**
   * Renders the key-value table component with all interactive features.
   * Includes table headers, dynamic rows, and action buttons based on component configuration.
   * @returns Template result for the component.
   */
  render() {
    return html`
      <div data-host-inner class="uk-keyval">
        <table class="${this.$cls.table} uk-table">
          <thead>
            <tr>
              <th>${this.$i18n['header-key']}</th>
              <th>${this.$i18n['header-value']}</th>
              <th class="uk-table-shrink">
                ${this.noninsertable
                  ? ''
                  : html`
                      <button
                        class="${this.$cls
                          .button} uk-btn uk-btn-default uk-btn-icon"
                        type="button"
                        @click=${() => this.addRow()}
                        .disabled="${this.max > 0
                          ? this._options.__.options.length >= this.max
                          : false}"
                      >
                        ${this.$icons('plus')}
                      </button>
                    `}
              </th>
            </tr>
          </thead>
          <tbody>
            ${this._options.__ && this._options.__.options
              ? this._options.__.options.map(
                  (option, index) => html`
                    <tr>
                      <td>
                        <input
                          autocomplete="off"
                          class="${this.$cls.input} uk-input"
                          placeholder="${this.$i18n['placeholder-key']}"
                          type="text"
                          value="${option.data.gid || ''}"
                          @input=${(e: Event) => this.handleKeyChange(index, e)}
                        />
                      </td>
                      <td>
                        <div class="uk-inline uk-keyval-value-wrapper">
                          ${this.sensitive
                            ? html`
                                <button
                                  class="${option.value
                                    ? 'uk-disabled'
                                    : ''} uk-form-icon uk-form-icon-flip"
                                  type="button"
                                  @click=${() => this.setRandomValue(index)}
                                >
                                  ${this.$icons('wand')}
                                </button>
                              `
                            : ''}

                          <input
                            autocomplete="off"
                            class="${this.$cls.input} uk-input"
                            placeholder="${this.$i18n['placeholder-value']}"
                            type="${this.getInputType(index)}"
                            name="${option.data.gid || ''}"
                            .value="${option.value}"
                            @input=${(e: Event) =>
                              this.handleValueChange(index, e)}
                            ?disabled=${!option.data.gid}
                          />
                        </div>
                      </td>
                      <td class="uk-table-shrink">
                        <div class="uk-keyval-actions">
                          ${this.sensitive
                            ? html`
                                <button
                                  class="${this.$cls
                                    .button} uk-btn uk-btn-default uk-btn-icon"
                                  type="button"
                                  @click=${() =>
                                    this.togglePasswordVisibility(index)}
                                >
                                  ${this.getPasswordVisibility(index)
                                    ? this.$icons('eye-off')
                                    : this.$icons('eye')}
                                </button>
                              `
                            : ''}
                          <button
                            class="${this.$cls
                              .button} uk-btn uk-btn-default uk-btn-icon"
                            type="button"
                            @click=${() => this.removeRow(index)}
                            ?disabled=${this._options.__.options.length <= 1}
                          >
                            ${this.$icons('trash-2')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `,
                )
              : ''}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-keyval': Keyval;
  }
}
