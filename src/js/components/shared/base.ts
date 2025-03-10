import { LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { parseOptions } from '../../helpers/common';

export abstract class Base extends LitElement {
  @property({ type: String })
  'cls-custom': string = '';

  @property({ type: String })
  i18n: string = '';

  @property({ type: Boolean })
  'force-prevent-rerender': boolean = false;

  @state()
  protected $i18n: { [key: string]: string } = {};

  @state()
  protected $cls: { [key: string]: string } = {};

  protected isRendered: boolean = false;

  protected get $locales() {
    const locales: { [key: string]: string | string[] } = {};

    Object.keys(this.$i18n).forEach(a => {
      locales[a] = this.$i18n[a].includes(',')
        ? this.$i18n[a].split(',').map(a => a.trim())
        : this.$i18n[a];
    });

    return locales;
  }

  private initializeCls(): void {
    if (this['cls-custom']) {
      const cls = parseOptions(this['cls-custom']) as
        | { [key: string]: string }
        | string;

      if (typeof cls === 'string') {
        this.$cls[this['cls-default-element']] = cls;
      } else {
        Object.keys(this.$cls).forEach(a => {
          const key = a;

          if (cls[key]) {
            this.$cls[key] = cls[key];
          }
        });
      }
    }
  }

  private initializeI18n(): void {
    if (this.i18n) {
      const i18n = parseOptions(this.i18n);

      if (typeof i18n === 'object') {
        this.$i18n = Object.assign(this.$i18n, i18n);
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.initializeCls();
    this.initializeI18n();
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected abstract 'cls-default-element': string;
}
