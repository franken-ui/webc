import { html, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type OptionItem } from '../helpers/select';
import { BaseSelect } from './shared/base-select';
import { repeat } from 'lit/directives/repeat.js';

/**
 * Type definition for internationalization strings used in the select component.
 */
type I18N = {
  /** Placeholder text for the search input */
  'search-placeholder': string;
  /** Template for displaying selection count (supports :n: placeholder) */
  'selection-count': string;
  /** Text for the insert button */
  insert: string;
};

/**
 * Type definition for CSS classes applied to different elements.
 */
type Cls = {
  /** CSS classes for the main button element */
  button: string;
  /** CSS classes for the icon element */
  icon: string;
  /** CSS classes for the dropdown container */
  dropdown: string;
};

/**
 * Custom select component that extends BaseSelect with full dropdown functionality.
 * Supports single/multiple selection, search, insertable options, and remote data fetching.
 *
 * @element uk-select
 * @extends BaseSelect
 *
 * @fires uk-select:input - Emitted when the selected value(s) change
 *
 * Features:
 * - Single and multiple selection modes
 * - Search/filter functionality
 * - Insertable options (add new options on the fly)
 * - Remote option fetching via HTTP
 * - Keyboard navigation
 * - Internationalization support
 * - UIKit integration
 */
@customElement('uk-select')
export class Select extends BaseSelect {
  /**
   * UIKit dropdown configuration string.
   * Controls dropdown behavior and positioning.
   *
   * @default 'mode: click'
   * @example
   * ```html
   * <uk-select drop="mode: click; pos: bottom-left"></uk-select>
   * ```
   */
  @property({ type: String })
  drop: string = 'mode: click; animation: uk-anmt-slide-top-sm;';

  /**
   * Enables search functionality, displaying a search input in the dropdown.
   *
   * @default false
   * @example
   * ```html
   * <uk-select searchable></uk-select>
   * ```
   */
  @property({ type: Boolean })
  searchable: boolean = false;

  /**
   * Allows users to insert new options that do not exist in the list.
   * When true, automatically enables search mode.
   *
   * @default false
   * @example
   * ```html
   * <uk-select insertable></uk-select>
   * ```
   */
  @property({ type: Boolean })
  insertable: boolean = false;

  /**
   * JSON string of HTTP headers to send with insert requests.
   * Should be a valid JSON object string.
   *
   * @example
   * ```html
   * <uk-select send-headers='{"Authorization": "Bearer ..."}'></uk-select>
   * ```
   */
  @property({ type: String })
  'send-headers': string;

  /**
   * URL endpoint for sending insert requests when insertable is true and remote fetching is needed.
   *
   * @example
   * ```html
   * <uk-select send-url="/api/options"></uk-select>
   * ```
   */
  @property({ type: String })
  'send-url': string;

  /**
   * HTTP method to use for insert requests.
   *
   * @default 'POST'
   * @example
   * ```html
   * <uk-select send-method="PUT"></uk-select>
   * ```
   */
  @property({ type: String })
  'send-method': string = 'POST';

  /**
   * Enables multiple selection mode, allowing users to select more than one option.
   *
   * @default false
   * @example
   * ```html
   * <uk-select multiple></uk-select>
   * ```
   */
  @property({ type: Boolean })
  multiple: boolean = false;

  /**
   * Icon name to display in the select button.
   * When empty, uses the default dropdown icon if the icon attribute is present.
   *
   * @default ''
   * @example
   * ```html
   * <uk-select icon="chevron-down"></uk-select>
   * ```
   */
  @property({ type: String })
  icon: string = '';

  /**
   * Array of currently selected option values.
   * Used for form submission and display.
   *
   * @default []
   * @internal
   */
  @state()
  $selected: string[] = [];

  /**
   * Internationalization strings for UI text.
   *
   * @default Default English strings
   * @internal
   */
  @state()
  $i18n: I18N = {
    'search-placeholder': 'Search',
    'selection-count': ':n: options selected',
    insert: 'Insert',
  };

  /**
   * CSS class configuration for component styling.
   * Allows customization of different component parts.
   *
   * @default Empty classes (styled via external CSS)
   * @internal
   */
  @state()
  $cls: Cls = {
    button: '',
    icon: '',
    dropdown: '',
  };

  /**
   * Internal icon state - tracks whether icon should be shown and what type.
   * false = no icon, true = default icon, string = custom icon name
   */
  private _icon: boolean | string = false;

  /**
   * Reference to the UIKit dropdown element for event handling.
   */
  private HTMLDrop: Element | null = null;

  /**
   * Display text for the select button based on current selection state.
   * Shows placeholder, selected option text, or selection count.
   *
   * @returns Display text for the button
   */
  protected get $text(): string {
    if (this.$selected.length === 0) {
      return this.placeholder !== '' ? this.placeholder : 'Select an option';
    }

    if (this.multiple === false && this.selected) {
      return this.selected.text;
    }

    if (this.$selected.length === 1 && this.selected) {
      return this.selected.text;
    }

    return this.$i18n['selection-count'].replace(
      ':n:',
      this.$selected.length.toString(),
    );
  }

  /**
   * Current form value(s) for submission.
   * Returns a string for single select, or an array for multiple select.
   *
   * @returns Selected value(s)
   */
  protected get $value(): string | string[] {
    return this.multiple
      ? this.$selected
      : this.$selected.length === 1
        ? this.$selected[0]
        : '';
  }

  /**
   * Total count of available options, including insertable option if applicable.
   * Used for keyboard navigation bounds.
   *
   * @returns Number of options
   */
  override get count(): number {
    let total =
      this.insertable && this.$term !== '' && !this.hasOption(this.$term)
        ? 1
        : 0;

    for (const parent in this.options) {
      const count = this.options[parent].options.length;
      total += count;
    }

    return total - 1;
  }

  /**
   * The default element key used for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the button element.
   * @internal
   */
  protected readonly 'cls-default-element': string = 'button';

  /**
   * Event name dispatched when value changes.
   * @internal
   */
  protected readonly 'input-event': string = 'uk-select:input';

  /**
   * Event name dispatched when search term changes.
   * @internal
   */
  protected readonly 'search-event': string = 'uk-select:search';

  /**
   * Initializes component state when connected to DOM.
   * Sets up icon configuration, initial selection, and insertable behavior.
   */
  connectedCallback(): void {
    super.connectedCallback();

    // Configure icon display
    if (this.hasAttribute('icon')) {
      const icon = this.getAttribute('icon');
      this._icon = icon === '' ? true : (icon as string);
    }

    // Initialize selection from value attribute or selected options
    if (this.hasAttribute('value')) {
      this.$selected = this.value.split(',').map(v => v.trim());

      if (!this.multiple) {
        this.$selected = this.$selected.slice(-1);
      }

      this.updateSelectedFromValues();
    } else {
      let values: string[] = [];

      for (const parent in this._options) {
        const options = this._options[parent].options;

        if (this.multiple) {
          options.forEach(option => {
            if (option.selected) {
              values.push(option.value);
            }
          });
        } else {
          const lastSelected = [...options]
            .reverse()
            .find(option => option.selected);

          if (lastSelected) {
            values = [lastSelected.value];
            this.selected = lastSelected;
            break;
          }
        }
      }

      this.$selected = values;

      // Only update selected for multiple selection mode
      if (this.multiple) {
        this.updateSelectedFromValues();
      }
    }

    // Enable search when insertable is true
    if (this.insertable) {
      this.searchable = true;
    }
  }

  /**
   * Sets up UIKit dropdown event listeners and element references.
   * Called after first render is complete.
   */
  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.HTMLDrop = this.renderRoot.querySelector('.uk-drop');

    if (this.HTMLDrop) {
      this.HTMLRectParent = this.renderRoot.querySelector('ul');

      // Handle dropdown hide events
      window.UIkit.util.on(this.HTMLDrop, 'hidden', () => {
        this.$open = false;
        this.$focused = -1;
        this.$term = '';
      });

      // Handle dropdown show events
      window.UIkit.util.on(this.HTMLDrop, 'shown', () => {
        this.$open = true;
      });
    }

    this.isRendered = true;
  }

  /**
   * Empty implementation - value initialization handled in connectedCallback
   * due to select component's special lifecycle requirements.
   */
  protected initializeValue(): void {
    // Functionality moved to connectedCallback() due to select component's special lifecycle
  }

  /**
   * Selects or deselects an option based on current selection mode.
   * Handles both single and multiple selection scenarios.
   *
   * @param item - The option item to select/deselect
   */
  protected select(item: OptionItem): void {
    if (item.disabled) {
      return;
    }

    if (this.multiple) {
      const existingIndex = this.$selected.findIndex(a => a === item?.value);
      if (existingIndex === -1) {
        this.$selected.push(item.value);
      } else {
        this.$selected = this.$selected.filter(a => a !== item.value);
      }

      if (this.$selected.length > 0) {
        this.updateSelectedFromValues();
      }

      this.requestUpdate();
    } else {
      this.$selected = [item.value];
      this.selected = item;
    }

    this.emit();
  }

  /**
   * Updates the selected property to match the last selected value.
   * Used to maintain consistency between $selected array and selected object.
   */
  private updateSelectedFromValues(): void {
    if (this.$selected.length > 0) {
      const lastValue = this.$selected[this.$selected.length - 1];

      for (const parent in this._options) {
        const lastSelected = this._options[parent].options.find(
          option => option.value === lastValue,
        );

        if (lastSelected) {
          this.selected = lastSelected;
          break;
        }
      }
    }
  }

  /**
   * Handles keyboard events with additional Tab key handling for accessibility.
   * Prevents default Tab behavior when dropdown is open.
   */
  private onInputKeydown(e: KeyboardEvent): void {
    this.onKeydown(e);

    if (this.$open === true) {
      switch (e.key) {
        case 'Tab':
          if (!e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
          }
          break;
      }
    }
  }

  /**
   * Handles Enter key press when an option is focused.
   * Supports both regular option selection and insertable option creation.
   */
  protected onKeydownEnter(): void {
    const dataset = this.HTMLRectActive?.dataset;

    if (dataset) {
      const key: string = dataset.key as string;
      const index: number = dataset.index as unknown as number;

      if (key === '__insert__') {
        this.insert();
      } else {
        this.select(this.options[key].options[index]);
      }
    }
  }

  /**
   * Handles click events on option items.
   */
  protected onClick(options: { item: OptionItem; index: number }): void {
    const { item } = options;
    this.select(item);
  }

  /**
   * Returns CSS classes for different dropdown elements.
   * Implements the abstract _cls method from BaseSelect.
   */
  protected _cls(options?: { item: OptionItem; index: number }): {
    parent: string;
    item: string;
    'item-header': string;
    'item-link': string;
    'item-wrapper': string;
    'item-icon': string;
    'item-text': string;
    [key: string]: string;
  } {
    return {
      parent:
        'uk-nav uk-dropdown-nav uk-overflow-auto uk-custom-select-options',
      item: options?.item.disabled === true ? 'uk-disabled opacity-50' : '',
      'item-header': 'uk-nav-header',
      'item-link': this.multiple === false ? 'uk-drop-close' : '',
      'item-icon': 'uk-custom-select-item-icon',
      'item-wrapper': 'uk-custom-select-item-wrapper',
      'item-text': 'uk-custom-select-item-text',
      'item-subtitle': 'uk-nav-subtitle',
    };
  }

  /**
   * Renders a single option item in the dropdown list.
   * Includes support for icons, descriptions, and selection indicators.
   *
   * @param key - The group key this option belongs to
   * @param item - The option item to render
   * @param index - The index of this option within its group
   * @returns Template result for the option item
   */
  protected renderListItem(
    key: string,
    item: OptionItem,
    index: number,
  ): TemplateResult {
    const cls = this._cls({ item, index });

    return html`
      <li class="${cls['item']}">
        <a
          data-key="${key}"
          data-index="${index}"
          @click="${() => this.onClick({ item, index })}"
          class="${cls['item-link']}"
          tabindex="-1"
        >
          <div class="${cls['item-wrapper']}">
            ${item.data.icon
              ? html`
                  <uk-icon
                    class="${cls['item-icon']}"
                    icon="${item.data.icon}"
                  ></uk-icon>
                `
              : ''}
            ${item.data.description
              ? html`
                  <div>
                    <span class="${cls['item-text']}">${item.text}</span>
                    <div class="${cls['item-subtitle']}">
                      ${item.data.description}
                    </div>
                  </div>
                `
              : html`<span class="${cls['item-text']}">${item.text}</span>`}
          </div>
          ${this.$selected.includes(item.value)
            ? html`
                <span class="uk-custom-select-check" data-uk-check-icon></span>
              `
            : ''}
        </a>
      </li>
    `;
  }

  /**
   * Checks if an option with the given value already exists in the options list.
   *
   * @param value The option value to check for
   * @returns True if option exists, false otherwise
   */
  private hasOption(value: string): boolean {
    return Object.values(this._options).some(group =>
      group.options.some(option => option.value === value),
    );
  }

  /**
   * Adds a new option to the options structure, creating the group if it doesn't exist.
   *
   * @param item The option item to add
   * @param key The group key to add the option to
   * @returns True if option was added, false if it already existed
   */
  private addOption(item: OptionItem, key: string): boolean {
    const options = this._options[key]?.options || [];
    const exists = options.some(option => option.value === item.value);

    if (!exists) {
      this._options = { ...this._options };

      if (this._options[key] === undefined) {
        this._options[key] = {
          text: item.group || '__',
          options: [],
        };
      }

      this._options[key].options.push(item);
    }

    return !exists;
  }

  /**
   * Sends an HTTP request to create a new option remotely.
   * Falls back to local option creation if the request fails.
   *
   * @returns Promise resolving to the created option item
   */
  private async send(): Promise<OptionItem> {
    /**
     * Validates that response data matches OptionItem structure.
     */
    function validate(data: any): boolean {
      return (
        typeof data === 'object' &&
        'group' in data &&
        'value' in data &&
        'text' in data &&
        'disabled' in data &&
        'selected' in data &&
        'data' in data &&
        'key' in data.data &&
        'keywords' in data.data
      );
    }

    try {
      if (!this['send-url']) {
        throw new Error('No send URL provided');
      }

      const headers: HeadersInit = this['send-headers']
        ? JSON.parse(this['send-headers'])
        : { 'Content-Type': 'application/json' };

      const payload = {
        term: this.$term,
      };

      const response = await fetch(this['send-url'], {
        method: this['send-method'],
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (validate(data)) {
        return data as OptionItem;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      // Fallback: create local option
      return {
        group: '__',
        text: this.$term,
        value: this.$term,
        data: {
          gid: '__',
          keywords: [this.$term],
        },
        selected: true,
        disabled: false,
      };
    }
  }

  /**
   * Inserts a new option based on the current search term.
   * Attempts remote creation first, falls back to local creation.
   * @internal
   */
  protected async insert(): Promise<void> {
    const item = await this.send();

    this.addOption(item, item.data.gid as string);

    if (this.multiple) {
      this.$selected.push(this.$term);
    } else {
      this.$selected = [this.$term];
    }

    this.selected = item;
    this.$term = '';
  }

  /**
   * Renders the search input field when searchable is enabled.
   * Includes search icon and proper event handling.
   * @internal
   */
  private renderSearch() {
    return this.searchable === true
      ? html`
          <div class="uk-custom-select-search">
            <span uk-search-icon></span>
            <input
              placeholder=${this.$i18n['search-placeholder']}
              type="text"
              .value="${this.$term}"
              @input="${(e: InputEvent) => {
                const input = e.target as HTMLInputElement;
                this.$term = input.value;
              }}"
              @keydown="${this.onInputKeydown}"
            />
          </div>
          ${Object.keys(this.options).length > 0
            ? html`<hr class="uk-hr" />`
            : ''}
        `
      : '';
  }

  /**
   * Renders the insertion option when insertable mode is active
   * and the search term doesn't match existing options.
   * @internal
   */
  private renderInsertion() {
    return html`
      <li>
        <a
          data-key="__insert__"
          @click="${(e: MouseEvent) => {
            e.preventDefault();
            this.insert();
          }}"
          tabindex="-1"
        >
          ${this.$i18n['insert']} ${this.$term}
        </a>
      </li>
    `;
  }

  /**
   * Renders the complete dropdown list with options and insertion capability.
   * Overrides parent implementation to add insertion functionality.
   * @internal
   */
  protected override renderList() {
    const cls = this._cls();

    return html`
      <ul class="${cls['parent']}" tabindex="-1" @keydown="${this.onKeydown}">
        ${repeat(
          Object.keys(this.options),
          groupKey => html`
            ${this.renderListHeader(groupKey)}
            ${repeat(this.options[groupKey].options, (option, index) =>
              this.renderListItem(groupKey, option, index),
            )}
          `,
        )}
        ${this.insertable && this.$term && !this.hasOption(this.$term)
          ? this.renderInsertion()
          : ''}
      </ul>
    `;
  }

  /**
   * Renders the complete select component, including button, dropdown, and hidden input for form integration.
   *
   * @returns Template for the component
   */
  render() {
    return html`
      <div data-host-inner class="uk-position-relative">
        <button
          class="${this.$cls['button']}"
          type="button"
          .disabled=${this.disabled}
          @keydown="${this.onKeydown}"
        >
          ${this.$text}
          ${this._icon === true
            ? html`
                <span
                  class="${this.$cls['icon']}"
                  data-uk-drop-parent-icon
                ></span>
              `
            : this.icon !== ''
              ? html`
                  <uk-icon
                    class="${this.$cls['icon']}"
                    icon="${this.icon}"
                  ></uk-icon>
                `
              : ''}
        </button>
        <div
          class="${`uk-drop uk-dropdown ${this.$cls['dropdown']}`}"
          uk-dropdown="${this.drop}"
        >
          ${this.renderSearch()} ${this.renderList()}
        </div>
        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-select': Select;
  }
}
