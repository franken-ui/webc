import { type PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseLsh } from './shared/base-lsh';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

/**
 * A lightweight, individual theme control component that:
 * - Syncs a single theme property between localStorage and document.documentElement classes
 * - Provides complete styling flexibility for developers
 * - Manages CSS class conflicts by removing existing classes in the same group
 * - Persists selections in localStorage under '__FRANKEN__' key
 * - Emits events when values change
 * - Allows arbitrary HTML content as the clickable trigger
 * - Auto-updates active state when other components in the same group change
 *
 * Unlike uk-theme-switcher which provides a complete UI, uk-lsh gives developers
 * full control over presentation while handling the theme logic.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <uk-lsh value="uk-theme-zinc" group="uk-theme">
 *   <button class="my-custom-button">Zinc Theme</button>
 * </uk-lsh>
 *
 * <!-- With complex content -->
 * <uk-lsh value="uk-size-large" group="uk-size">
 *   <div class="theme-card">
 *     <span class="icon">📏</span>
 *     <span class="label">Large Size</span>
 *   </div>
 * </uk-lsh>
 *
 * <!-- Special mode handling -->
 * <uk-lsh value="dark" group="mode">
 *   Toggle Dark Mode
 * </uk-lsh>
 *
 * <!-- Disable auto-update -->
 * <uk-lsh value="uk-theme-zinc" group="uk-theme" prevent-autoupdate>
 *   Manual Update Only
 * </uk-lsh>
 * ```
 *
 * @fires uk-lsh:change - Dispatched when theme value changes
 */
@customElement('uk-lsh')
export class Lsh extends BaseLsh {
  /**
   * Event name dispatched when configuration changes.
   * @internal
   */
  protected readonly 'change-event': string = 'uk-lsh:change';

  /**
   * The default element key used for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the button element.
   */
  protected 'cls-default-element' = 'button';

  /**
   * The CSS class value to apply when this component is activated.
   * For 'mode' group, use 'light' or 'dark'.
   * For other groups, use the full class name (e.g., 'uk-theme-zinc').
   */
  @property({ type: String })
  value: string = '';

  /**
   * The theme group this component controls.
   * Used to remove conflicting classes and organize localStorage.
   * Special handling for 'mode' group (light/dark theme).
   */
  @property({ type: String })
  group: string = '';

  /**
   * Prevents automatic updates when other components in the same group change.
   * When true, the component will not listen for uk-lsh:change events.
   */
  @property({ type: Boolean })
  'prevent-autoupdate': boolean = false;

  /**
   * Whether this component's value is currently active.
   * @private
   */
  @state()
  private isActive: boolean = false;

  /**
   * Bound event listener for handling external changes.
   * @private
   */
  private boundHandleExternalChange = this.handleExternalChange.bind(this);

  /**
   * Lit lifecycle: Component connected to DOM.
   * Loads configuration, determines active state, and sets up event listener.
   */
  connectedCallback(): void {
    super.connectedCallback();
    this.updateActiveState();

    if (!this['prevent-autoupdate']) {
      document.addEventListener(
        'uk-lsh:change' as keyof DocumentEventMap,
        this.boundHandleExternalChange,
      );
    }
  }

  /**
   * Lit lifecycle: Component disconnected from DOM.
   * Cleans up event listener.
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener(
      'uk-lsh:change' as keyof DocumentEventMap,
      this.boundHandleExternalChange,
    );
  }

  /**
   * Lit lifecycle: Component updated after property changes.
   * Recalculates active state when value or group properties change.
   * Updates event listener when this['prevent-autoupdate'] changes.
   */
  protected updated(changedProperties: PropertyValues): void {
    if (changedProperties.has('value') || changedProperties.has('group')) {
      this.updateActiveState();
    }

    if (changedProperties.has('preventAutoupdate')) {
      if (this['prevent-autoupdate']) {
        document.removeEventListener(
          'uk-lsh:change' as keyof DocumentEventMap,
          this.boundHandleExternalChange,
        );
      } else {
        document.addEventListener(
          'uk-lsh:change' as keyof DocumentEventMap,
          this.boundHandleExternalChange,
        );
      }
    }
  }

  /**
   * Updates the active state based on current configuration and DOM state.
   * @private
   */
  private updateActiveState(): void {
    this.isActive = this.isValueActive(this.group, this.value);
  }

  /**
   * Handles external uk-lsh:change events from other components.
   * Updates active state if the change affects this component's group.
   * @private
   */
  private handleExternalChange(event: Event): void {
    // Cast to CustomEvent to access detail
    const customEvent = event as CustomEvent;

    // Don't respond to our own events
    if (customEvent.target === this) {
      return;
    }

    const { group } = customEvent.detail;

    // Only update if the change affects our group
    if (group === this.group) {
      this.isActive = false;
    }
  }

  /**
   * Handles click events on the component.
   * Applies the theme value when clicked.
   * @private
   */
  private handleClick(): void {
    this.applyThemeValue(this.group, this.value);
    this.updateActiveState();
  }

  /**
   * Gets the template content from the component's children.
   * @private
   */
  private getTemplateContent() {
    const template = this.querySelector('template');

    if (template) {
      return template.innerHTML;
    }

    return this.innerHTML;
  }

  /**
   * Main render method for the component.
   *
   * Creates a clickable button that:
   * - Applies active state class for styling
   * - Handles click events to trigger theme changes
   * - Displays template content or innerHTML as button content
   *
   * @returns Lit HTML template
   */
  render() {
    const content = this.getTemplateContent();

    return html`
      <button
        data-host-inner
        class="uk-lsh ${this.isActive ? 'uk-active' : ''} ${this.$cls[
          'button'
        ]}"
        @click="${this.handleClick}"
        type="button"
      >
        ${unsafeHTML(content)}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-lsh': Lsh;
  }
}
