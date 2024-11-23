import { LitElement, html } from 'lit';
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
  [key: string]: OptionItem[];
};

type Config = {
  mode: string;
  theme: string;
  radii: string;
  shadows: string;
};

@customElement('uk-theme-switcher')
export class ThemeSwitcher extends LitElement {
  @state()
  $config: Config = {
    mode: 'light',
    theme: 'uk-theme-zinc',
    radii: 'uk-radii-md',
    shadows: 'uk-shadows-sm',
  };

  private HTMLSelect: HTMLSelectElement | null = null;

  private _options: Option = {};

  connectedCallback(): void {
    super.connectedCallback();

    this.$config = {
      mode: document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light',
      theme: localStorage.getItem('theme') || 'uk-theme-zinc',
      radii: localStorage.getItem('radii') || 'uk-radii-md',
      shadows: localStorage.getItem('shadows') || 'uk-shadows-sm',
    };

    this.HTMLSelect = this.renderRoot.querySelector('select');

    if (this.HTMLSelect) {
      this.createOptions();
    }
  }

  protected createOptions() {
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

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private setKey(key: string, value: string) {
    const head = document.documentElement;

    const current = Array.from(head.classList).find(cls =>
      cls.startsWith(`uk-${key}-`),
    );

    if (current) {
      head.classList.remove(current);
    }

    head.classList.add(value);

    localStorage.setItem(key, value);
  }

  private setMode(mode: 'light' | 'dark') {
    this.$config['mode'] = mode;

    if (mode === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mode', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mode', 'dark');
    }

    this.dispatchEvent(
      new CustomEvent('uk-theme-switcher:mode', {
        detail: {
          value: mode,
        },
        bubbles: true,
        composed: true,
      }),
    );
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
            this.setMode(a.toLowerCase() as 'light' | 'dark');
            this.requestUpdate();
          }}"
        >
          ${a === 'Light'
            ? html`<uk-icon icon="sun"></uk-icon>`
            : html`<uk-icon icon="moon"></uk-icon>`}
          <span class="uk-ts-text">${a}</span>
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
                    <div class="uk-form-label">${a}</div>
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
                <div class="uk-form-label">Mode</div>
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
