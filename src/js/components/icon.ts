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

  private _svg: SVGElement | string = '';

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
    if (this.renderRoot.children.length >= 1) {
      return this._svg;
    }

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

      this._svg = e;

      return e;
    } catch (e) {}
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-icon': Icon;
  }
}
