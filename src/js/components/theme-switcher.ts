import { LitElement, PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

type OptionItemData = { key: string; [key: string]: any };

type OptionItem = {
  value: string;
  text: string;
  disabled: boolean;
  selected: boolean;
  data: OptionItemData;
};

type Option = {
  [key: string]: {
    text: string;
    options: OptionItem[];
  };
};

type Config = {
  [key: string]: string;
};

@customElement('uk-theme-switcher')
export class ThemeSwitcher extends LitElement {
  @state()
  $config: Config = {
    mode: 'light',
    theme: 'uk-theme-zinc',
    radii: 'uk-radii-md',
    shadows: 'uk-shadows-sm',
    font: 'uk-font-sm',
  };

  @state()
  '__FRANKEN__': string;

  private HTMLSelect: HTMLSelectElement | null = null;

  private _options: Option = {};

  private _rendered: boolean = false;

  connectedCallback(): void {
    super.connectedCallback();

    const __FRANKEN__ = JSON.parse(localStorage.getItem('__FRANKEN__') || '{}');

    Object.keys(__FRANKEN__).forEach(a => {
      this.$config[a] = __FRANKEN__[a];
    });

    this.HTMLSelect = this.renderRoot.querySelector('select');

    if (this.HTMLSelect) {
      this.createOptions();
    }
  }

  protected createOptions() {
    if (this._rendered === true) {
      return;
    }

    if (this.HTMLSelect) {
      const add = (
        group: string,
        option: HTMLOptionElement,
        isOptGroupDisabled?: boolean | undefined,
      ) => {
        let value: string | undefined;

        if (option.hasAttribute('value')) {
          value = option.getAttribute('value') as string;
        } else {
          value = option.textContent as string;
        }

        const data: OptionItemData = { key: group };

        Object.keys(option.dataset).forEach(attr => {
          data[attr] = option.dataset[attr];
        });

        (this._options[group]['options'] =
          this._options[group]['options'] || []).push({
          value: value,
          text: option.textContent as string,
          disabled: isOptGroupDisabled === true ? true : option.disabled,
          selected: option.hasAttribute('selected'),
          data: data,
        });
      };

      Array.from(this.HTMLSelect.children).map(a => {
        if (a.nodeName === 'OPTGROUP') {
          const z = a as HTMLOptGroupElement;
          const key = z.dataset['key'];

          if (key) {
            this._options[key] = {
              text: z.getAttribute('label') as string,
              options: [],
            };

            Array.from(z.children).map(b => {
              const option = b as HTMLOptionElement;
              add(key, option, z.disabled);
            });
          }
        }
      });
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this._rendered = true;
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

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
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
    const key = item.data.key;

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
          this.setKey(item.data.key, item.value);

          this.$config[key] = item.value;

          this.requestUpdate();
        }}"
      >
        ${item.data.hex
          ? html`
              <span
                class="uk-ts-hex"
                style="${`background:${item.data.hex}`}"
              ></span>
            `
          : item.data.icon
            ? html`<uk-icon icon=${item.data.icon}></uk-icon>`
            : ''}
        <span class="uk-ts-text">${item.text}</span>
      </button>
    `;
  }

  render() {
    return html`
      <div class="uk-ts">
        ${Object.keys(this._options).map(
          a => html`
            <div class="uk-ts-key">
              <div class="uk-form-label">${this._options[a].text}</div>
              <div class="uk-ts-value">
                ${repeat(
                  this._options[a].options,
                  _ => _,
                  (item: OptionItem) => this.renderKeys(item),
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
