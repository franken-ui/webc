import { LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as icons from 'lucide';
import { createElement } from 'lucide';

@customElement('uk-icon')
export class Icon extends LitElement {
  @property({ type: String })
  'cls-custom': string = '';

  @property({ type: String })
  icon: string = '';

  @property({ type: String })
  'stroke-width': string = '2';

  @property({ type: String })
  height: string = '16';

  @property({ type: String })
  width: string = '16';

  @state()
  svg: SVGElement | undefined;

  get i() {
    return this.icon
      .trim()
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (
      _changedProperties.has('icon') ||
      _changedProperties.has('stroke-width') ||
      _changedProperties.has('height') ||
      _changedProperties.has('width')
    ) {
      this.updateComplete.then(() => {
        this.svg = this.createSvg({
          icon: this.i,
          cls: this['cls-custom'],
          height: this.height,
          width: this.width,
          strokeWidth: this['stroke-width'],
        });
      });
    }
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private createSvg(options: {
    icon: string;
    cls: string;
    height: string;
    width: string;
    strokeWidth: string;
  }): SVGElement | undefined {
    const { icon, cls, height, width, strokeWidth } = options;

    try {
      // @ts-ignore
      const e = createElement(icons[icon]);

      e.setAttribute('class', cls);
      e.setAttribute('height', height);
      e.setAttribute('stroke-width', strokeWidth);
      e.setAttribute('width', width);

      return e;
    } catch (e) {
      return undefined;
    }
  }

  render() {
    if (this.renderRoot.children.length === 0) {
      return this.svg;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-icon': Icon;
  }
}
