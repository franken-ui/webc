import { type PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import {
  type OptionItem,
  type OptionGrouped,
  selectToObject,
} from '../helpers/select';
import { BaseLsh } from './shared/base-lsh';

/**
 * ThemeSwitcher Web Component
 *
 * @element uk-theme-switcher
 * @extends {BaseLsh}
 *
 * A dynamic theme switching component that:
 * - Reads theme options from a hidden HTML select element
 * - Provides an interactive UI for switching between theme variants
 * - Persists theme choices in localStorage under '__FRANKEN__' key
 * - Manages CSS classes on document.documentElement for theme application
 * - Supports special 'mode' handling for light/dark theme switching
 * - Emits custom events when theme changes occur
 *
 * @fires uk-theme-switcher:change - Dispatched when theme configuration changes
 *
 * @example
 * ```html
 * <uk-theme-switcher>
 *   <select style="display: none;">
 *     <optgroup label="Mode">
 *       <option value="light" selected>Light</option>
 *       <option value="dark">Dark</option>
 *     </optgroup>
 *     <optgroup label="Color">
 *       <option value="uk-color-blue" data-hex="#0066cc">Blue</option>
 *       <option value="uk-color-red" data-hex="#cc0000">Red</option>
 *     </optgroup>
 *   </select>
 * </uk-theme-switcher>
 * ```
 */
@customElement('uk-theme-switcher')
export class ThemeSwitcher extends BaseLsh {
  /**
   * Event name dispatched when configuration changes.
   * @internal
   */
  protected readonly 'change-event': string = 'uk-theme-switcher:change';

  /**
   * The default element key used for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the div element.
   */
  protected 'cls-default-element' = 'div';

  /**
   * Serialized version of configuration for triggering reactive updates.
   * Used internally to detect configuration changes and trigger localStorage saves.
   */
  @state()
  // @ts-ignore
  private '__FRANKEN__': string = '';

  /**
   * Reference to the HTML select element containing theme options.
   * This element is typically hidden and serves as the data source.
   */
  private HTMLSelect: HTMLSelectElement | null = null;

  /**
   * Parsed theme option groups from the select element.
   * Organized by group name with arrays of selectable options.
   */
  private keys: OptionGrouped = {};

  /**
   * Lit lifecycle: Component connected to DOM.
   * Initializes theme state and parses the select element for available options.
   */
  connectedCallback(): void {
    super.connectedCallback();

    // Get reference to select element and parse its options
    this.HTMLSelect = this.renderRoot.querySelector('select');
    if (this.HTMLSelect && this.isRendered === false) {
      this.keys = selectToObject(
        this.HTMLSelect as HTMLSelectElement,
      ) as OptionGrouped;
    }
  }

  /**
   * Lit lifecycle: First render completed.
   * Marks component as rendered to prevent re-parsing select options.
   */
  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.isRendered = true;
  }

  /**
   * Lit lifecycle: Component updated after property changes.
   * Handles persistence to localStorage and event emission when configuration changes.
   */
  protected updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('__FRANKEN__')) {
      // Save configuration and emit custom event for theme-switcher
      this.saveConfiguration();
      this.dispatchEvent(
        new CustomEvent('uk-theme-switcher:change', {
          detail: {
            value: this.$config,
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  /**
   * Updates theme configuration and applies changes to the document.
   *
   * @param key - The theme category key (e.g., 'mode', 'color', 'size')
   * @param value - The selected value for this theme category
   * @private
   */
  private setKey(key: string, value: string): void {
    // Apply theme value using base class method
    this.applyThemeValue(key, value);

    // Trigger reactive update by changing serialized config
    this.__FRANKEN__ = JSON.stringify(this.$config);
  }

  /**
   * Renders a single theme option button.
   *
   * Determines active state based on current configuration or default selection.
   * Supports three display modes:
   * - Hex color swatch (if item.data.hex is provided)
   * - Icon display (if item.data.icon is provided)
   * - Text-only button
   *
   * @param item - The option item to render
   * @returns Lit HTML template for the option button
   * @private
   */
  private renderKeys(item: OptionItem) {
    const key = item.group as string;

    // Determine if this option is currently active
    const isActive =
      this.isValueActive(key, item.value) ||
      (!this.$config[key] && item.selected === true);

    return html`
      <button
        class="${isActive ? 'uk-active' : ''}"
        @click="${() => {
          this.setKey(item.group as string, item.value);
          this.requestUpdate();
        }}"
      >
        ${item.data.hex
          ? html`
              <span
                class="uk-theme-switcher-hex"
                style="background:${item.data.hex}"
              ></span>
            `
          : item.data.icon
            ? html`<uk-icon icon=${item.data.icon}></uk-icon>`
            : ''}
        <span class="uk-theme-switcher-text">${item.text}</span>
      </button>
    `;
  }

  /**
   * Main render method for the component.
   *
   * Creates a theme switcher interface with:
   * - One section per theme group (from select optgroups)
   * - Label for each theme category
   * - Buttons for each available option in that category
   *
   * @returns Lit HTML template for the complete theme switcher UI
   */
  render() {
    return html`
      <div data-host-inner class="${this.$cls['div']} uk-theme-switcher">
        ${Object.keys(this.keys).map(
          groupKey => html`
            <div class="uk-theme-switcher-key">
              <div class="uk-form-label">${this.keys[groupKey].text}</div>
              <div class="uk-theme-switcher-value">
                ${repeat(
                  this.keys[groupKey].options,
                  option => option,
                  item => this.renderKeys(item),
                )}
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-theme-switcher': ThemeSwitcher;
  }
}
