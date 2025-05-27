import { customElement, property, state } from 'lit/decorators.js';
import { Base } from './shared/base';
import { type PropertyValues, html } from 'lit';
import ApexCharts from 'apexcharts';

/**
 * A Lit-based web component that wraps ApexCharts to provide declarative chart rendering.
 *
 * @element uk-chart
 * @extends {Base}
 *
 * Features:
 * - Declarative chart configuration via JSON script tags
 * - Optional reactive updates when configuration changes
 * - Integration with the Base class for i18n and custom CSS support
 * - Automatic chart lifecycle management
 *
 * @example
 * ```html
 * <uk-chart reactive>
 *   <script type="application/json">
 *     {
 *       "chart": { "type": "bar" },
 *       "series": [{ "data": [1, 2, 3, 4] }]
 *     }
 *   </script>
 * </uk-chart>
 * ```
 */
@customElement('uk-chart')
export class Chart extends Base {
  /**
   * The default element key used for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the div element.
   */
  protected 'cls-default-element': string = 'div';

  /**
   * Enables reactive updates to the chart when the configuration script changes.
   * When true, the component observes the JSON script element for mutations and
   * automatically updates the chart when changes are detected.
   *
   * @default false
   */
  @property({ type: Boolean })
  reactive: boolean = false;

  /**
   * Parsed chart configuration options from the JSON script element.
   * This object is passed directly to ApexCharts constructor and updateOptions.
   */
  @state()
  $options: object = {};

  /**
   * ApexCharts instance for rendering and managing the chart.
   */
  private _apexCharts: ApexCharts | null = null;

  /**
   * Reference to the JSON script element containing chart configuration.
   * This element's content is parsed to create the chart options.
   */
  protected HTMLScript: HTMLScriptElement | null = null;

  /**
   * MutationObserver instance for watching changes to the script element.
   * Only active when reactive property is true.
   */
  protected observer: MutationObserver | null = null;

  /**
   * Lit lifecycle method called when component is added to DOM.
   * Initializes the chart configuration and sets up reactive observation if enabled.
   */
  connectedCallback(): void {
    super.connectedCallback();

    this.HTMLScript = this.renderRoot.querySelector(
      'script[type="application/json"]',
    );

    if (this.HTMLScript) {
      this.createOptions();

      if (this.reactive) {
        this.initializeReactiveObserver();
      }
    }

    this.initializeApexCharts();
  }

  /**
   * Lit lifecycle method called after first render.
   * Creates and renders the ApexCharts instance.
   */
  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.initializeApexCharts();
  }

  /**
   * Lit lifecycle method called after each update.
   * Updates the chart options if they have changed.
   *
   * @param _changedProperties - Properties that changed in this update cycle
   */
  updated(_changedProperties: PropertyValues): void {
    if (this._apexCharts && _changedProperties.has('$options')) {
      this._apexCharts.updateOptions(this.$options);
    }
  }

  /**
   * Lit lifecycle method called when component is removed from DOM.
   * Cleans up the mutation observer and chart resources.
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this._apexCharts) {
      this._apexCharts.destroy();
      this._apexCharts = null;
    }
  }

  /**
   * Sets up MutationObserver to watch for changes in the script element.
   * Observes attributes, child nodes, character data, and subtree changes.
   */
  private initializeReactiveObserver(): void {
    if (!this.HTMLScript) {
      return;
    }

    this.observer = new MutationObserver(() => {
      this.createOptions();
    });

    this.observer.observe(this.HTMLScript, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  /**
   * Initializes the ApexCharts instance and renders the chart.
   * Creates a new ApexCharts object if one does not already exist and attaches it to the chart container.
   * Sets the isRendered flag to true after rendering.
   */
  private initializeApexCharts(): void {
    const chartContainer = this.renderRoot.querySelector('div');

    if (this._apexCharts === null && chartContainer) {
      this._apexCharts = new ApexCharts(chartContainer, this.$options);
      this._apexCharts.render();
      this.isRendered = true;
    }
  }

  /**
   * Parses the JSON script element content to create chart options.
   * Prevents unnecessary updates when reactive is false and chart is already rendered.
   * Falls back to empty object if JSON parsing fails.
   */
  protected createOptions(): void {
    // Skip updates if not reactive and already rendered
    if (!this.reactive && this.isRendered) {
      return;
    }

    if (this.HTMLScript) {
      try {
        const content = this.HTMLScript.textContent;
        this.$options = content ? JSON.parse(content) : {};
      } catch (error) {
        console.warn('Failed to parse chart options JSON:', error);
        this.$options = {};
      }
    }
  }

  /**
   * Renders the chart container element.
   * The container receives the chart instance and applies custom CSS classes.
   */
  render() {
    return html`
      <div data-host-inner class="${this.$cls['div'] || ''} uk-chart"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-chart': Chart;
  }
}
