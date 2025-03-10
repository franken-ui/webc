import { PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { OptionItem, OptionGrouped, selectToJson } from '../helpers/select';
import { Base } from './shared/base';

type Config = {
  [key: string]: string;
};

@customElement('uk-theme-switcher')
export class ThemeSwitcher extends Base {
  protected 'cls-default-element' = 'div';

  @state()
  $config: Config = {};

  @state()
  '__FRANKEN__': string;

  private HTMLSelect: HTMLSelectElement | null = null;

  private keys: OptionGrouped = {};

  connectedCallback(): void {
    super.connectedCallback();

    this.$config['mode'] = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';

    const __FRANKEN__ = JSON.parse(localStorage.getItem('__FRANKEN__') || '{}');

    Object.keys(__FRANKEN__).forEach(a => {
      this.$config[a] = __FRANKEN__[a];
    });

    this.HTMLSelect = this.renderRoot.querySelector('select');

    if (this.HTMLSelect && this.isRendered === false) {
      this.keys = selectToJson(
        this.HTMLSelect as HTMLSelectElement,
      ) as OptionGrouped;
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.isRendered = true;
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('__FRANKEN__')) {
      localStorage.setItem('__FRANKEN__', JSON.stringify(this.$config));

      this.dispatchEvent(
        new CustomEvent(`uk-theme-switcher:change`, {
          detail: {
            value: this.$config,
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private setKey(key: string, value: string) {
    const head = document.documentElement;

    this.$config[key] = value;

    if (key === 'mode') {
      this.$config['mode'] = value;

      if (value === 'light') {
        head.classList.remove('dark');
      } else {
        head.classList.add('dark');
      }
    } else {
      const current = Array.from(head.classList).find(cls =>
        cls.startsWith(`uk-${key}-`),
      );

      if (current) {
        head.classList.remove(current);
      }

      head.classList.add(value);
    }

    this.__FRANKEN__ = JSON.stringify(this.$config);
  }

  private renderKeys(item: OptionItem) {
    const key = item.group as string;

    return html`
      <button
        class="${this.$config[key]
          ? this.$config[key] === item.value
            ? 'uk-active'
            : ''
          : item.selected === true
            ? 'uk-active'
            : ''}"
        @click="${() => {
          this.setKey(item.group as string, item.value);

          this.$config[key] = item.value;

          this.requestUpdate();
        }}"
      >
        ${item.data.hex
          ? html`
              <span
                class="uk-theme-switcher-hex"
                style="${`background:${item.data.hex}`}"
              ></span>
            `
          : item.data.icon
            ? html`<uk-icon icon=${item.data.icon}></uk-icon>`
            : ''}
        <span class="uk-theme-switcher-text">${item.text}</span>
      </button>
    `;
  }

  render() {
    return html`
      <div data-host-inner class="uk-theme-switcher ${this.$cls['div']}">
        ${Object.keys(this.keys).map(
          a => html`
            <div class="uk-theme-switcher-key">
              <div class="uk-form-label">${this.keys[a].text}</div>
              <div class="uk-theme-switcher-value">
                ${repeat(
                  this.keys[a].options,
                  _ => _,
                  item => this.renderKeys(item),
                )}
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-theme-switcher': ThemeSwitcher;
  }
}
