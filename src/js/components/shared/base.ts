import { LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { parseOptions } from '../../helpers/common';

export abstract class Base extends LitElement {
  @property({ type: String })
  'cls-custom': string = '';

  @property({ type: String })
  i18n: string = '';

  @state()
  protected $i18n: { [key: string]: string } = {};

  @state()
  protected $cls: { [key: string]: string } = {};

  protected get locales() {
    const i18n: { [key: string]: string | string[] } = {};

    Object.keys(this.$i18n).forEach(a => {
      i18n[a] = this.$i18n[a].includes(',')
        ? this.$i18n[a].split(',').map(a => a.trim())
        : this.$i18n[a];
    });

    return i18n;
  }

  protected initializeCls(): void {
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

  connectedCallback(): void {
    super.connectedCallback();

    this.initializeCls();
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected abstract 'cls-default-element': string;
}
