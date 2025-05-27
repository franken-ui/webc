import { html, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type OptionItem } from '../helpers/select';
import { BaseSelect } from './shared/base-select';
import { titleCase } from '../helpers/common';

/**
 * A command palette component that provides a searchable modal interface for executing commands.
 *
 * This component creates a modal dialog with a search input and filterable list of commands/actions.
 * It supports keyboard shortcuts for opening, arrow key navigation, and command execution.
 *
 * Features:
 * - Modal-based interface with backdrop
 * - Keyboard shortcut activation (Ctrl + key)
 * - Real-time search filtering
 * - Arrow key navigation
 * - Command execution with custom events
 * - UIKit modal integration
 *
 * @fires uk-command:search - Dispatched when search term changes
 * @fires uk-command:click - Dispatched when a command is selected
 *
 * @example
 * ```html
 * <uk-command
 *   key="k"
 *   toggle="command-modal"
 *   placeholder="Search commands...">
 *   <select>
 *     <optgroup label="File">
 *       <option value="new" data-icon="plus">New File</option>
 *       <option value="open" data-icon="folder">Open File</option>
 *     </optgroup>
 *     <option value="help" data-icon="help-circle">Help</option>
 *   </select>
 * </uk-command>
 * ```
 */
@customElement('uk-command')
export class Command extends BaseSelect {
  /**
   * The keyboard key used with a modifier to open the command palette.
   * When set, pressing the modifier + this key will toggle the modal.
   *
   * @example
   * ```html
   * <uk-command key="k"></uk-command> <!-- Opens with Ctrl+K -->
   * <uk-command key="k" modifier="alt"></uk-command> <!-- Opens with Alt+K -->
   * ```
   */
  @property({ type: String })
  key: string | undefined;

  /**
   * The modifier key used with the main key to open the command palette.
   * Supported values: 'ctrl', 'alt', 'shift', 'meta'
   *
   * @default 'ctrl'
   */
  @property({ type: String })
  modifier: string = 'ctrl';

  /**
   * The ID of the modal element for UIKit modal targeting.
   * Used to identify this specific modal instance when multiple modals exist.
   *
   * @default ''
   */
  @property({ type: String })
  toggle: string = '';

  /**
   * Reference to the UIKit modal DOM element.
   * Used for programmatic modal control (show/hide/toggle).
   */
  private HTMLModal: Element | null = null;

  /**
   * The name of the custom event dispatched when search term changes.
   * @readonly
   */
  protected readonly 'search-event': string = 'uk-command:search';

  /**
   * Default CSS class for the root element (not used in this component).
   * @readonly
   */
  protected readonly 'cls-default-element' = '';

  /**
   * Input event name (not used in command palette).
   * @readonly
   */
  protected 'input-event': string = '';

  /**
   * Called after the component is first rendered.
   * Sets up modal references, keyboard shortcuts, and event listeners.
   *
   * @param _changedProperties - Map of changed properties (unused)
   */
  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.HTMLModal = this.renderRoot.querySelector('.uk-modal');

    if (this.HTMLModal) {
      // Set up parent reference for keyboard navigation
      this.HTMLRectParent = this.renderRoot.querySelector('ul');

      // Set up keyboard shortcut if key is specified
      if (this.key !== undefined) {
        document.addEventListener('keydown', e => {
          const modifierPressed = this.getModifierPressed(e);

          if (modifierPressed && e.key === this.key) {
            e.preventDefault();
            window.UIkit.modal(this.HTMLModal).toggle();
          }
        });
      }

      window.UIkit.util.on(this.HTMLModal, 'shown', () => {
        this.$open = true;
      });

      // Reset state when modal is hidden
      window.UIkit.util.on(this.HTMLModal, 'hidden', () => {
        this.$focused = -1;
        this.$term = '';
        this.$open = false;
      });
    }

    this.isRendered = true;
  }

  /**
   * Generates CSS classes for different elements in the command palette.
   * Provides UIKit-specific styling classes for the modal interface.
   *
   * @param options - Optional context with item and index information
   * @returns Object mapping element types to CSS class strings
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
      parent: 'uk-overflow-auto uk-nav uk-nav-secondary uk-cmd-body',
      item: options?.item.disabled === true ? 'uk-disabled opacity-50' : '',
      'item-header': 'uk-nav-header',
      'item-link': options?.item.disabled === false ? 'uk-modal-close' : '',
      'item-icon': 'uk-cmd-item-icon',
      'item-wrapper': 'uk-cmd-item-wrapper',
      'item-text': 'uk-cmd-item-text',
      'item-key': 'uk-cmd-item-key',
      'item-subtitle': 'uk-nav-subtitle',
    };
  }

  /**
   * Handles click events on command items.
   * Delegates to the select method for command execution.
   *
   * @param options - Object containing the clicked item and its index
   */
  protected onClick(options: { item: OptionItem; index: number }): void {
    const { item } = options;

    this.select(item);
  }

  /**
   * Handles Enter key press when a command is focused.
   * Executes the currently focused command from the filtered list.
   */
  protected onKeydownEnter(): void {
    const dataset = this.HTMLRectActive?.dataset;

    if (dataset) {
      const key: string = dataset.key as string;
      const index: number = dataset.index as unknown as number;

      this.select(this.options[key].options[index]);
    }
  }

  /**
   * Executes a selected command item.
   *
   * This method:
   * 1. Checks if the command is disabled and returns early if so
   * 2. Closes the modal
   * 3. Dispatches a custom event with the command details
   *
   * @param item - The command item to execute
   *
   * @fires uk-command:click - Custom event with the selected command details
   */
  protected select(item: OptionItem): void {
    if (item.disabled) {
      return;
    }

    // Close the modal
    window.UIkit.modal(this.HTMLModal).hide();

    // Dispatch command execution event
    this.dispatchEvent(
      new CustomEvent('uk-command:click', {
        detail: {
          value: item,
        },
        bubbles: true,
        composed: true,
      }),
    );
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
  ): TemplateResult | undefined {
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
            <span class="${cls['item-text']}">${item.text}</span>
            ${item.data.key
              ? html`
                  <span class="${cls['item-key']}">
                    ${titleCase(item.data?.modifier) || 'Ctrl'} +
                    ${item.data.key.toUpperCase()}
                  </span>
                `
              : ''}
          </div>
        </a>
      </li>
    `;
  }

  /**
   * Gets the current value of the component.
   * Not applicable for command palette.
   *
   * @returns Empty string (no value concept in command palette)
   */
  protected get $value(): string | string[] {
    return '';
  }

  /**
   * Gets the current text of the component.
   * Not applicable for command palette.
   *
   * @returns Empty string (no text concept in command palette)
   */
  protected get $text(): string {
    return '';
  }

  /**
   * Initializes the component value.
   * Not needed for command palette.
   */
  protected initializeValue(): void {}

  /**
   * Checks if the specified modifier key is pressed in a keyboard event.
   *
   * @param e - The keyboard event
   * @param modifier - The modifier key to check ('ctrl', 'alt', 'shift', 'meta')
   * @returns Whether the modifier key is pressed
   */
  private getModifierPressed(e: KeyboardEvent, modifier?: string): boolean {
    const mod = modifier || this.modifier;

    switch (mod.toLowerCase()) {
      case 'ctrl':
        return e.ctrlKey;
      case 'alt':
        return e.altKey;
      case 'shift':
        return e.shiftKey;
      case 'meta':
        return e.metaKey;
      default:
        return e.ctrlKey; // fallback to ctrl
    }
  }

  /**
   * Renders the search header section of the command palette.
   *
   * Includes:
   * - Search icon
   * - Input field with live search
   * - Escape button for closing
   * - Horizontal separator if commands exist
   *
   * @returns Template result for the search header
   */
  private renderSearch(): TemplateResult {
    return html`
      <div class="uk-cmd-header">
        <div class="uk-cmd-header-icon">
          <span uk-search-icon></span>
        </div>
        <div class="uk-cmd-header-input">
          <input
            autofocus
            placeholder="${this.placeholder}"
            type="text"
            .value="${this.$term}"
            @keydown=${this.onInputKeyDown}
            @input=${(e: InputEvent) => {
              const input = e.target as HTMLInputElement;
              this.$term = input.value;
            }}
          />
        </div>
        <div class="uk-cmd-header-esc">
          <button class="uk-modal-close uk-btn uk-btn-default uk-btn-sm">
            Esc
          </button>
        </div>
      </div>
      ${Object.keys(this.options).length > 0 ? html`<hr class="uk-hr" />` : ''}
    `;
  }

  /**
   * Renders the complete command palette modal.
   *
   * Creates a UIKit modal with:
   * - Search interface
   * - Scrollable command list
   * - Keyboard navigation support
   *
   * @returns Template result for the entire modal
   */
  render(): TemplateResult {
    return html`
      <div
        data-host-inner
        class="uk-modal uk-flex-top"
        id="${this.toggle}"
        data-uk-modal
      >
        <div class="uk-modal-dialog uk-margin-auto-vertical">
          ${this.renderSearch()} ${this.renderList()}
        </div>
      </div>
    `;
  }

  private onInputKeyDown(e: KeyboardEvent): void {
    if (!this.$open) {
      return;
    }

    // Handle regular input keydown events
    this.onKeydown(e);

    // Handle individual item shortcuts
    Object.values(this.options).forEach(group => {
      group.options.forEach(item => {
        if (item.data?.key) {
          const modifierPressed = this.getModifierPressed(
            e,
            item.data?.modifier || 'ctrl',
          );

          if (
            modifierPressed &&
            e.key.toLowerCase() === item.data.key.toLowerCase()
          ) {
            e.preventDefault();
            e.stopPropagation(); // Stop event bubbling

            this.select(item);

            return; // Exit after handling shortcut
          }
        }
      });
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-command': Command;
  }
}
