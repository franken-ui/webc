import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { parseOptions } from '../helpers/common';

type OptionItemData = { key: string; [key: string]: any };

type OptionItem = {
  value: string;
  text: string;
  disabled: boolean;
  selected: boolean;
  data: OptionItemData;
};

type Option = {
  [key: string]: OptionItem[];
};

type Config = {
  mode: string;
  theme: string;
  radii: string;
  shadows: string;
};

type I18N = {
  theme: string;
  radii: string;
  shadows: string;
  mode: string;
  light: string;
  dark: string;
};

@customElement('uk-theme-switcher')
export class ThemeSwitcher extends LitElement {
  @property({ type: String })
  i18n: string = '';

  @state()
  $config: Config = {
    mode: 'light',
    theme: 'uk-theme-zinc',
    radii: 'uk-radii-md',
    shadows: 'uk-shadows-sm',
  };

  @state()
  '__FRANKEN__': string;

  @state()
  $i18n: I18N = {
    theme: 'Theme',
    radii: 'Radii',
    shadows: 'Shadows',
    mode: 'Mode',
    light: 'Light',
    dark: 'Dark',
  };

  private HTMLSelect: HTMLSelectElement | null = null;

  private _options: Option = {};

  private _rendered: boolean = false;

  connectedCallback(): void {
    super.connectedCallback();

    if (this.i18n) {
      const i18n = parseOptions(this.i18n) as I18N;

      if (typeof i18n === 'string') {
        this.$i18n['theme'] = i18n;
      } else {
        this.$i18n = Object.assign(this.$i18n, i18n);
      }
    }

    const __FRANKEN__ = JSON.parse(localStorage.getItem('__FRANKEN__') || '{}');
    const mode = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';

    this.$config = {
      mode: mode,
      theme: __FRANKEN__.theme || 'uk-theme-zinc',
      radii: __FRANKEN__.radii || 'uk-radii-md',
      shadows: __FRANKEN__.shadows || 'uk-shadows-sm',
    };

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

        const data: OptionItemData = { key: group.toLowerCase() };

        Object.keys(option.dataset).forEach(attr => {
          data[attr] = option.dataset[attr];
        });

        (this._options[group] = this._options[group] || []).push({
          value: value,
          text: option.textContent as string,
          disabled: isOptGroupDisabled === true ? true : option.disabled,
          selected: option.hasAttribute('selected'),
          data: data,
        });
      };

      Array.from(this.HTMLSelect.children).map(a => {
        if (a.nodeName === 'OPTGROUP') {
          const group = a as HTMLOptGroupElement;

          Array.from(group.children).map(b => {
            const option = b as HTMLOptionElement;

            add(group.getAttribute('label') as string, option, group.disabled);
          });
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

    this.$config[key as 'mode' | 'theme' | 'radii' | 'shadows'] = value;

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
    const key = item.data.key as 'mode' | 'theme' | 'radii' | 'shadows';

    return html`
      <button
        class="${this.$config[key] === item.value ? 'uk-active' : ''}"
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
          : ''}
        <span class="uk-ts-text">${item.text}</span>
      </button>
    `;
  }

  private renderModes() {
    return html`${['Light', 'Dark'].map(
      a => html`
        <button
          class="${this.$config['mode'] === a.toLowerCase() ? 'uk-active' : ''}"
          @click="${() => {
            this.setKey('mode', a.toLowerCase());
            this.requestUpdate();
          }}"
        >
          ${a === 'Light'
            ? html`<uk-icon icon="sun"></uk-icon>`
            : html`<uk-icon icon="moon"></uk-icon>`}
          <span class="uk-ts-text">
            ${this.$i18n[a.toLowerCase() as 'light' | 'dark']}
          </span>
        </button>
      `,
    )}`;
  }

  render() {
    return html`
      <div class="uk-ts">
        ${['Theme', 'Radii', 'Shadows'].map(
          a => html`
            ${this._options[a]
              ? html`
                  <div class="uk-ts-key">
                    <div class="uk-form-label">
                      ${this.$i18n[
                        a.toLowerCase() as 'theme' | 'radii' | 'shadows'
                      ]}
                    </div>
                    <div class="uk-ts-value">
                      ${repeat(
                        this._options[a],
                        _ => _,
                        (item: OptionItem) => this.renderKeys(item),
                      )}
                    </div>
                  </div>
                `
              : ''}
          `,
        )}
        ${this._options['Mode']
          ? html`
              <div class="uk-ts-key">
                <div class="uk-form-label">${this.$i18n['mode']}</div>
                <div class="uk-ts-value">${this.renderModes()}</div>
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-theme-switcher': ThemeSwitcher;
  }
}
