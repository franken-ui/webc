import { property, state } from 'lit/decorators.js';
import { Input } from './input';
import { html, type PropertyValues, type TemplateResult } from 'lit';
import {
  type OptionGrouped,
  type OptionItem,
  selectToObject,
} from '../../helpers/select';
import { repeat } from 'lit/directives/repeat.js';

/**
 * Abstract base class for custom select components that extends the Input class.
 * Provides core functionality for searchable, keyboard-navigable select dropdowns
 * with support for option groups, reactive updates, and custom rendering.
 *
 * This class handles:
 * - Option filtering based on search terms
 * - Keyboard navigation (arrow keys, enter)
 * - Focus management and visual indicators
 * - Reactive updates when underlying select changes
 * - Group-based option organization
 *
 * @abstract
 * @extends {Input}
 */
export abstract class BaseSelect extends Input {
  /**
   * The name of the custom event dispatched when search term changes.
   * Must be implemented by concrete classes.
   * @abstract
   * @readonly
   */
  protected abstract readonly 'search-event': string;

  /**
   * Generates CSS classes for different elements in the select dropdown.
   * Must be implemented by concrete classes to provide styling.
   *
   * @abstract
   * @param options - Optional context with item and index information
   * @returns Object mapping element types to CSS class strings
   */
  protected abstract _cls(options?: { item: OptionItem; index: number }): {
    parent: string;
    item: string;
    'item-header': string;
    'item-link': string;
    'item-wrapper': string;
    'item-icon': string;
    'item-text': string;
    [key: string]: string;
  };

  /**
   * Handles click events on option items.
   * Must be implemented by concrete classes.
   *
   * @abstract
   * @param context - Object containing the clicked item and its index
   */
  protected abstract onClick(context: {
    item: OptionItem;
    index: number;
  }): void;

  /**
   * Handles selection of an option item.
   * Must be implemented by concrete classes.
   *
   * @abstract
   * @param item - The option item to select
   */
  protected abstract select(item: OptionItem): void;

  /**
   * Handles Enter key press when an option is focused.
   * Must be implemented by concrete classes.
   *
   * @abstract
   */
  protected abstract onKeydownEnter(): void;

  /**
   * Renders a single option item in the dropdown list.
   * Must be implemented by concrete classes.
   *
   * @abstract
   * @param key - The group key this option belongs to
   * @param item - The option item to render
   * @param index - The index of this option within its group
   * @returns Template result for the option item
   */
  protected abstract renderListItem(
    key: string,
    item: OptionItem,
    index: number,
  ): TemplateResult | undefined;

  /**
   * Whether the select should reactively update when the underlying
   * HTML select element changes. When true, uses MutationObserver
   * to watch for changes.
   *
   * @default false
   */
  @property({ type: Boolean })
  reactive: boolean = false;

  /**
   * Current search/filter term entered by the user.
   * Used to filter options based on keywords.
   *
   * @default ''
   */
  @state()
  $term: string = '';

  /**
   * Index of the currently focused option in the filtered list.
   * -1 indicates no option is focused.
   *
   * @default -1
   */
  @state()
  $focused: number = -1;

  /**
   * Whether the dropdown is currently open/visible.
   *
   * @default false
   */
  @state()
  $open: boolean = false;

  /**
   * Reference to the underlying HTML select element.
   * Set during connectedCallback.
   */
  protected HTMLSelect: HTMLSelectElement | null = null;

  /**
   * Reference to the parent container element for scrolling calculations.
   * Used for focus management and keyboard navigation.
   */
  protected HTMLRectParent: HTMLElement | null = null;

  /**
   * Reference to the currently active/focused option element.
   * Used for visual focus indicators and scrolling.
   */
  protected HTMLRectActive: HTMLElement | null = null;

  /**
   * MutationObserver instance for watching changes to the HTML select.
   * Only used when reactive mode is enabled.
   */
  protected observer: MutationObserver | null = null;

  /**
   * Complete set of options parsed from the HTML select element.
   * Contains all options regardless of current filter.
   */
  protected _options: OptionGrouped = {};

  /**
   * Currently selected option item, if any.
   */
  protected selected: OptionItem | null = null;

  /**
   * Filtered options based on the current search term.
   * Returns only options whose keywords contain the search term (case-insensitive).
   * Groups with no matching options are excluded from the result.
   *
   * @returns Filtered option groups containing only matching options
   */
  get options(): OptionGrouped {
    const options: OptionGrouped = {};

    Object.entries(this._options).forEach(([key, group]) => {
      const filtered = group.options.filter(option =>
        option.data.keywords?.some(k =>
          k.toLowerCase().includes(this.$term.toLowerCase()),
        ),
      );

      if (filtered.length > 0) {
        options[key] = {
          text: group.text,
          options: filtered,
          ...(group.data && { data: group.data }),
        };
      }
    });

    return options;
  }

  /**
   * Total count of filtered options minus 1 (for zero-based indexing).
   * Used for keyboard navigation bounds checking.
   *
   * @returns Number of available options for navigation
   */
  get count(): number {
    let total = 0;

    for (const parent in this.options) {
      const count = this.options[parent].options.length;
      total += count;
    }

    return total - 1;
  }

  /**
   * Called when the element is added to the DOM.
   * Sets up the HTML select reference and initializes options.
   * Optionally sets up reactive monitoring with MutationObserver.
   */
  connectedCallback(): void {
    super.connectedCallback();

    this.HTMLSelect = this.renderRoot.querySelector('select');

    if (this.HTMLSelect) {
      this.createOptions();

      if (this.reactive) {
        this.observer = new MutationObserver(() => {
          this.createOptions();
          this.requestUpdate();
        });

        this.observer.observe(this.HTMLSelect, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        });
      }
    }
  }

  /**
   * Called when the element is removed from the DOM.
   * Cleans up the MutationObserver if it exists.
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Called after the element's properties have been updated.
   * Handles search term changes and focus management.
   *
   * @param _changedProperties - Map of changed properties and their previous values
   */
  protected updated(_changedProperties: PropertyValues): void {
    // Handle search term changes
    if (
      _changedProperties.has('$term') &&
      _changedProperties.get('$term') !== undefined
    ) {
      this.dispatchEvent(
        new CustomEvent(this['search-event'], {
          detail: {
            value: this.$term,
          },
          bubbles: true,
          composed: true,
        }),
      );

      this.updateComplete.then(() => {
        this.$focused = -1;
      });
    }

    // Handle focus changes
    if (_changedProperties.has('$focused')) {
      if (this.HTMLRectParent) {
        this.HTMLRectParent.querySelector('li.uk-active')?.classList.remove(
          'uk-active',
        );

        this.HTMLRectActive =
          this.HTMLRectParent.querySelectorAll('a')[this.$focused];

        if (this.HTMLRectActive) {
          this.focusActiveOption();
          this.HTMLRectActive.closest('li')?.classList.add('uk-active');
        }
      }
    }
  }

  /**
   * Creates/updates the options structure from the HTML select element.
   * Only processes if reactive mode is enabled or component hasn't been rendered yet.
   * Uses the selectToObject helper to parse the select element.
   */
  protected createOptions(): void {
    if (this.reactive === false && this.isRendered === true) {
      return;
    }

    if (this.HTMLSelect) {
      this._options = selectToObject(this.HTMLSelect);
    }
  }

  /**
   * Handles keyboard navigation through the option list.
   * Updates the focused index based on direction, with wrapping at boundaries.
   *
   * @param direction - Navigation direction ('t' for up, 'd' for down)
   */
  protected navigate(direction: 't' | 'd'): void {
    switch (direction) {
      case 't':
        if (this.$focused <= 0) {
          this.$focused = this.count;
        } else {
          this.$focused--;
        }
        break;

      case 'd':
        if (this.$focused < this.count) {
          this.$focused++;
        } else {
          this.$focused = 0;
        }
        break;
    }
  }

  /**
   * Scrolls the dropdown container to ensure the currently focused option is visible.
   * Centers the focused option within the visible area of the container.
   *
   * @param behavior - Scroll behavior ('smooth' for animated, 'auto' for instant)
   */
  protected focusActiveOption(behavior: ScrollBehavior = 'smooth'): void {
    if (this.HTMLRectParent && this.HTMLRectActive) {
      const rects = {
        parent: this.HTMLRectParent.getBoundingClientRect(),
        active: this.HTMLRectActive.getBoundingClientRect(),
      };

      this.HTMLRectParent.scrollTo({
        top:
          this.HTMLRectActive.offsetTop -
          this.HTMLRectParent.offsetTop -
          rects.parent.height / 2 +
          rects.active.height / 2,
        behavior: behavior,
      });
    }
  }

  /**
   * Handles keyboard events for dropdown navigation.
   * Supports arrow keys for navigation and Enter for selection.
   * Only processes events when the dropdown is open.
   *
   * @param e - The keyboard event
   */
  protected onKeydown(e: KeyboardEvent): void {
    if (this.$open === true) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.navigate('d');
          break;

        case 'ArrowUp':
          e.preventDefault();
          this.navigate('t');
          break;

        case 'Enter':
          e.preventDefault();

          if (this.$focused === -1) {
            return;
          }

          this.onKeydownEnter();
          break;
      }
    }
  }

  /**
   * Renders the complete dropdown list with all filtered options.
   * Uses repeat directive for efficient updates and includes keyboard event handling.
   *
   * @returns Template result for the dropdown list
   */
  protected renderList(): TemplateResult {
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
      </ul>
    `;
  }

  /**
   * Renders a group header for the dropdown list.
   * Skips rendering for the special '__' group (ungrouped options).
   *
   * @param header - The group key/name to render as header
   * @returns Template result for the group header, or empty string for '__' group
   */
  protected renderListHeader(header: string): TemplateResult | string {
    const cls = this._cls();

    return header !== '__'
      ? html`<li class="${cls['item-header']}">${header}</li>`
      : '';
  }
}
