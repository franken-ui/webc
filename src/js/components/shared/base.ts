import { LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { parseOptions } from '../../helpers/common';

/**
 * Abstract base class for all components, providing:
 * - Internationalization (i18n) support
 * - Custom CSS class management
 * - Render optimization controls
 *
 * Components extending this class automatically support `i18n` and `cls-custom` attributes.
 */
export abstract class Base extends LitElement {
  /**
   * Custom CSS classes that can be applied to component elements.
   * Can be a simple string or a serialized object for targeting multiple elements.
   *
   * @example
   * Simple string:
   * ```html
   * <my-component cls-custom="my-class"></my-component>
   * ```
   * Object:
   * ```html
   * <my-component cls-custom='{"container": "uk-wrapper", "button": "uk-btn-primary"}'></my-component>
   * ```
   */
  @property({ type: String })
  'cls-custom': string = '';

  /**
   * Internationalization strings for component localization.
   * Should be a serialized object containing translation keys and values.
   *
   * @example
   * ```html
   * <my-component i18n='{"greeting": "Hello", "weekdays": "Mon, Tue, Wed"}'></my-component>
   * ```
   */
  @property({ type: String })
  i18n: string = '';

  /**
   * Prevents component re-rendering by removing existing rendered content.
   * Useful for forcing a clean render state in dynamic content scenarios.
   */
  @property({ type: Boolean })
  'force-prevent-rerender': boolean = false;

  /**
   * Internal representation of parsed i18n data.
   * Populated from the `i18n` property during component initialization.
   */
  @state()
  protected $i18n: { [key: string]: string } = {};

  /**
   * Internal representation of parsed CSS classes.
   * Maps element keys to their corresponding CSS classes.
   */
  @state()
  protected $cls: { [key: string]: string } = {};

  /**
   * Tracks whether the component has been rendered.
   */
  protected isRendered: boolean = false;

  /**
   * Returns a processed version of `$i18n` that converts comma-separated strings into arrays.
   * Automatically splits strings containing commas and trims whitespace.
   *
   * @example
   * Input:
   * ```typescript
   * { weekdays: "Mon, Tue, Wed", greeting: "Hello" }
   * ```
   * Output:
   * ```typescript
   * { weekdays: ["Mon", "Tue", "Wed"], greeting: "Hello" }
   * ```
   */
  protected get $locales(): { [key: string]: string | string[] } {
    const locales: { [key: string]: string | string[] } = {};

    Object.keys(this.$i18n).forEach(key => {
      locales[key] = this.$i18n[key].includes(',')
        ? this.$i18n[key].split(',').map(item => item.trim())
        : this.$i18n[key];
    });

    return locales;
  }

  /**
   * Processes the `cls-custom` property and populates the `$cls` state.
   * - If `cls-custom` is a string: assigns it to the default element class.
   * - If `cls-custom` is an object: merges it with existing `$cls` mappings.
   */
  private initializeCls(): void {
    if (this['cls-custom']) {
      const cls = parseOptions(this['cls-custom']) as
        | { [key: string]: string }
        | string;

      if (typeof cls === 'string') {
        this.$cls[this['cls-default-element']] = cls;
      } else {
        Object.keys(cls).forEach(key => {
          this.$cls[key] = cls[key];
        });
      }
    }
  }

  /**
   * Processes the `i18n` property and populates the `$i18n` state.
   * Merges parsed i18n object with existing `$i18n` data.
   */
  private initializeI18n(): void {
    if (this.i18n) {
      const i18n = parseOptions(this.i18n);

      if (typeof i18n === 'object' && i18n !== null) {
        this.$i18n = Object.assign(this.$i18n, i18n);
      }
    }
  }

  /**
   * Lit lifecycle method called when the component is added to the DOM.
   * Initializes CSS classes, i18n data, and handles forced re-render prevention.
   */
  connectedCallback(): void {
    super.connectedCallback();

    this.initializeCls();
    this.initializeI18n();

    // Force clean render if requested and content exists
    if (
      this['force-prevent-rerender'] &&
      this.renderRoot.querySelector('[data-host-inner]')
    ) {
      this.renderRoot.querySelector('[data-host-inner]')?.remove();
    }
  }

  /**
   * Default element key for CSS class targeting.
   * Must be implemented by subclasses to define which element receives
   * simple string classes from `cls-custom`.
   */
  protected abstract 'cls-default-element': string;

  /**
   * Overrides the default Shadow DOM creation to render directly into the host element.
   * This allows the component to use Light DOM instead of being encapsulated in Shadow DOM,
   * enabling easier CSS styling and DOM manipulation from outside the component.
   *
   * @returns The host element itself, bypassing Shadow DOM.
   */
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }
}
