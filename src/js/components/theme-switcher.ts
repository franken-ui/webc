import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

type Theme = { background: string; key: string; text: string };

@customElement('uk-theme-switcher')
export class ThemeSwitcher extends LitElement {
  @property({ type: String })
  'custom-palette': string = '';

  @state()
  $mode: 'light' | 'dark' = 'light';

  @state()
  $theme = 'uk-theme-zinc';

  private palettes: Theme[] = [
    {
      background: '#52525b',
      key: 'uk-theme-zinc',
      text: 'Zinc',
    },
    {
      background: '#64748b',
      key: 'uk-theme-slate',
      text: 'Slate',
    },
    {
      background: '#78716c',
      key: 'uk-theme-stone',
      text: 'Stone',
    },
    {
      background: '#6b7280',
      key: 'uk-theme-gray',
      text: 'Gray',
    },
    {
      background: '#737373',
      key: 'uk-theme-neutral',
      text: 'Neutral',
    },
    {
      background: '#dc2626',
      key: 'uk-theme-red',
      text: 'Red',
    },
    {
      background: '#e11d48',
      key: 'uk-theme-rose',
      text: 'Rose',
    },
    {
      background: '#f97316',
      key: 'uk-theme-orange',
      text: 'Orange',
    },
    {
      background: '#16a34a',
      key: 'uk-theme-green',
      text: 'Green',
    },
    {
      background: '#2563eb',
      key: 'uk-theme-blue',
      text: 'Blue',
    },
    {
      background: '#facc15',
      key: 'uk-theme-yellow',
      text: 'Yellow',
    },
    {
      background: '#7c3aed',
      key: 'uk-theme-violet',
      text: 'Violet',
    },
  ];

  private customPalettes: Theme[] = [];

  connectedCallback(): void {
    super.connectedCallback();

    this.$theme = localStorage.getItem('theme') || 'uk-theme-zinc';
    this.$mode = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';

    if (this['custom-palette']) {
      try {
        this.customPalettes = JSON.parse(this['custom-palette']);
      } catch (e) {
        console.error(
          'Invalid palette. Please see https://franken-ui.dev/docs/theme-switcher for more details.',
        );
      }
    }

    this.removeAttribute('uk-cloak');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private setTheme(theme: string) {
    const head = document.documentElement;

    const currentTheme = Array.from(head.classList).find(cls =>
      cls.startsWith('uk-theme-'),
    );

    if (currentTheme) {
      head.classList.remove(currentTheme);
    }

    head.classList.add(theme);

    this.$theme = theme;

    localStorage.setItem('theme', theme);
  }

  private setMode(mode: 'light' | 'dark') {
    this.$mode = mode;

    if (mode === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mode', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mode', 'dark');
    }
  }

  private button(theme: Theme) {
    return html`
      <button
        class="${this.$theme === theme.key ? 'uk-active' : ''}"
        @click="${() => this.setTheme(theme.key)}"
      >
        <span class="circle" style="background:${theme.background}">
          ${this.$theme === theme.key
            ? html`<uk-icon icon="check"></uk-icon>`
            : ''}
        </span>
        <span>${theme.text}</span>
      </button>
    `;
  }

  render() {
    return html`
      <div class="uk-theme-switcher">
        <div class="uk-form-label">Color</div>
        <div class="uk-theme-switcher-options">
          ${repeat(
            this.palettes,
            (palette: Theme) => palette.key,
            (a: Theme) => this.button(a),
          )}
          ${repeat(
            this.customPalettes,
            (palette: Theme) => palette.key,
            (a: Theme) => this.button(a),
          )}
        </div>

        <div class="uk-margin-medium-top uk-form-label">Mode</div>
        <div class="uk-theme-switcher-options">
          <button
            class="${this.$mode === 'light' ? 'uk-active' : ''}"
            @click="${() => this.setMode('light')}"
          >
            <uk-icon class="uk-margin-small-right" icon="sun"></uk-icon>
            Light
          </button>
          <button
            class="${this.$mode === 'dark' ? 'uk-active' : ''}"
            @click="${() => this.setMode('dark')}"
          >
            <uk-icon class="uk-margin-small-right" icon="moon"></uk-icon>
            Dark
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-theme-switcher': ThemeSwitcher;
  }
}
