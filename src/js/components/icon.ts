import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as icons from 'lucide';
import { createElement } from 'lucide';

@customElement('uk-icon')
export class Icon extends LitElement {
  @property({ type: String })
  'custom-class': string = '';

  @property({ type: String })
  icon: string = '';

  @property({ type: String })
  'stroke-width': string = '2';

  @property({ type: String })
  height: string = '16';

  @property({ type: String })
  width: string = '16';

  constructor() {
    super();
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.removeAttribute('uk-cloak');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    const icon = this.icon
      .trim()
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    try {
      // @ts-ignore
      const e = createElement(icons[icon]);

      e.setAttribute('class', this['custom-class']);
      e.setAttribute('height', this.height);
      e.setAttribute('stroke-width', this['stroke-width']);
      e.setAttribute('width', this.width);

      return e;
    } catch (e) {}
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-icon': Icon;
  }
}
