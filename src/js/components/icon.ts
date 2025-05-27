import { type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import * as icons from 'lucide';
import { createElement } from 'lucide';
import { Base } from './shared/base';

/**
 * Icon component for displaying Lucide icons with customizable properties.
 * Extends the Base class to support i18n and custom CSS classes.
 *
 * @example
 * Basic usage:
 * ```html
 * <uk-icon icon="home" size="24" stroke-width="1.5"></uk-icon>
 * <uk-icon icon="arrow-right" width="20" height="20" cls-custom="text-blue-500"></uk-icon>
 * ```
 */
@customElement('uk-icon')
export class Icon extends Base {
  /**
   * The default element key used for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the SVG element.
   */
  protected 'cls-default-element' = 'svg';

  /**
   * The name of the Lucide icon to display (kebab-case format).
   * Automatically converted to PascalCase for Lucide icon lookup.
   *
   * @example
   * ```html
   * <uk-icon icon="arrow-right"></uk-icon>
   * <uk-icon icon="user-circle"></uk-icon>
   * ```
   */
  @property({ type: String })
  icon: string = '';

  /**
   * SVG stroke width for the icon outline.
   * Accepts any valid SVG stroke-width value.
   *
   * @example
   * ```html
   * <uk-icon icon="home" stroke-width="1.5"></uk-icon>
   * ```
   */
  @property({ type: String })
  'stroke-width': string = '2';

  /**
   * Icon height in pixels. Overridden by `size` property if provided.
   *
   * @example
   * ```html
   * <uk-icon icon="home" height="32"></uk-icon>
   * ```
   */
  @property({ type: String })
  height: string = '16';

  /**
   * Icon width in pixels. Overridden by `size` property if provided.
   *
   * @example
   * ```html
   * <uk-icon icon="home" width="32"></uk-icon>
   * ```
   */
  @property({ type: String })
  width: string = '16';

  /**
   * Uniform size for both width and height. Takes precedence over individual width and height.
   *
   * @example
   * ```html
   * <uk-icon icon="home" size="24"></uk-icon>
   * ```
   */
  @property({ type: String })
  size: string | undefined;

  /**
   * Generated SVG element ready for rendering.
   * This is set internally and should not be set directly.
   */
  @state()
  $svg: SVGElement | undefined;

  /**
   * CSS classes applied to the SVG element. Managed internally.
   */
  @state()
  $cls: { svg: string } = {
    svg: '',
  };

  /**
   * Converts kebab-case icon name to PascalCase for Lucide icon lookup.
   *
   * @example
   * "arrow-right" → "ArrowRight"
   */
  get key() {
    return this.icon
      .trim()
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Handles property updates and regenerates the SVG when icon-related properties change.
   * Only updates when relevant properties are changed.
   *
   * @param _changedProperties - Properties that changed in this update cycle
   */
  protected updated(_changedProperties: PropertyValues): void {
    if (
      ['icon', 'stroke-width', 'height', 'width', 'size'].some(property =>
        _changedProperties.has(property),
      )
    ) {
      this.updateComplete.then(() => {
        this.$svg = this.createSvg({
          icon: this.key,
          cls: this.$cls.svg,
          height: this.size || this.height,
          width: this.size || this.width,
          strokeWidth: this['stroke-width'],
        });
      });
    }
  }

  /**
   * Creates an SVG element using Lucide's createElement function.
   * Applies custom styling and dimensions to the generated SVG.
   *
   * @param options - Icon rendering options (icon name, class, height, width, strokeWidth)
   * @returns The generated SVG element, or undefined if icon is not found
   */
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

  /**
   * Renders the SVG icon element.
   * Only renders if no content already exists in the render root.
   *
   * @returns The SVG element, or undefined if not available
   */
  render() {
    if (this.renderRoot.children.length === 0) {
      return this.$svg;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-icon': Icon;
  }
}
