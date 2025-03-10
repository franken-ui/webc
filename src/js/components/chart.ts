import { customElement, property, state } from 'lit/decorators.js';
import { Base } from './shared/base';
import { PropertyValues, html } from 'lit';
import ApexCharts from 'apexcharts';

@customElement('uk-chart')
export class Chart extends Base {
  protected 'cls-default-element': string = 'div';

  private chart: ApexCharts | null = null;

  @property({ type: Boolean })
  reactive: boolean = false;

  @state()
  $options: object = {};

  protected HTMLScript: HTMLScriptElement | null = null;

  protected observer: MutationObserver | null = null;

  connectedCallback(): void {
    super.connectedCallback();

    this.HTMLScript = this.renderRoot.querySelector(
      'script[type="application/json"]',
    );

    if (this.HTMLScript) {
      this.createOptions();

      if (this.reactive) {
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
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.chart = new ApexCharts(
      this.renderRoot.querySelector('div'),
      this.$options,
    );

    this.chart.render();
    this.isRendered = true;
  }

  updated(_changedProperties: PropertyValues): void {
    if (this.chart && _changedProperties.has('$options')) {
      this.chart.updateOptions(this.$options);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.observer) {
      this.observer.disconnect();

      this.observer = null;
    }
  }

  protected createOptions() {
    if (this.reactive === false && this.isRendered === true) {
      return;
    }

    if (this.HTMLScript) {
      try {
        this.$options = JSON.parse(this.HTMLScript.textContent as string);
      } catch (e) {
        this.$options = {};
      }
    }
  }

  render() {
    return html`
      <div data-host-inner class="uk-chart ${this.$cls['div']}"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-chart': Chart;
  }
}
