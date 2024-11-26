import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { GroupedOptionsItem, BaseSelect } from './shared/base-select';
import { parseOptions } from '../helpers/common';

type I18N = {
  'search-placeholder': string;
  'selection-count': string;
};

type Cls = {
  button: string;
  icon: string;
  dropdown: string;
};

@customElement('uk-select')
export class Select extends BaseSelect {
  @property({ type: String })
  drop: string = 'mode: click';

  @property({ type: Boolean })
  searchable: boolean = false;

  @property({ type: Boolean })
  multiple: boolean = false;

  @property({ type: String })
  placeholder: string = 'Select an option';

  @property({ type: String })
  name: string = '';

  @property({ type: String })
  'cls-custom': string = '';

  @property({ type: String })
  i18n: string = '';

  @property({ type: String })
  icon: string = '';

  @state()
  $open: boolean = false;

  @state()
  $selected: string[] = [];

  @state()
  $i18n: I18N = {
    'search-placeholder': 'Search',
    'selection-count': ':n: options selected',
  };

  @state()
  $cls: Cls = {
    button: '',
    icon: '',
    dropdown: '',
  };

  private _icon: boolean | string = false;

  private HTMLDrop: Element | null = null;

  get text() {
    if (this.$selected.length === 0) {
      return this.placeholder !== '' ? this.placeholder : 'Select an option';
    }

    if (this.multiple === false) {
      return this._options.find(a => a.value === this.$selected[0])?.text;
    }

    if (this.$selected.length === 1) {
      return this._options.find(a => a.value === this.$selected[0])?.text;
    }

    return this.$i18n['selection-count'].replace(
      ':n:',
      this.$selected.length.toString(),
    );
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.i18n) {
      const i18n = parseOptions(this.i18n) as I18N;

      if (typeof i18n === 'object') {
        this.$i18n = Object.assign(this.$i18n, i18n);
      }
    }

    if (this['cls-custom']) {
      const cls = parseOptions(this['cls-custom']) as Cls | string;

      if (typeof cls === 'string') {
        this.$cls['button'] = cls;
      } else {
        Object.keys(this.$cls).forEach(a => {
          const key = a as 'button' | 'icon' | 'dropdown';

          if (cls[key]) {
            this.$cls[key] = cls[key];
          }
        });
      }
    }

    if (this.hasAttribute('icon')) {
      const icon = this.getAttribute('icon');

      if (icon === '') {
        this._icon = true;
      } else {
        this._icon = icon as string;
      }
    }

    this.$selected = this.options
      .filter(a => a.selected === true)
      .map(a => a.value);

    if (this.multiple === false) {
      this.$focused = this.options.findIndex(
        a => a.value === this.$selected[0],
      );
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.HTMLDrop = this.renderRoot.querySelector('.uk-drop');

    if (this.HTMLDrop) {
      this.HTMLRectParent = this.renderRoot.querySelector('ul');

      window.UIkit.util.on(this.HTMLDrop, 'hidden', () => {
        this.$open = false;
        this.$focused = -1;
        this.$term = '';
      });

      window.UIkit.util.on(this.HTMLDrop, 'shown', () => {
        this.$open = true;
      });
    }

    this._rendered = true;
  }

  private select(index: number) {
    if (index === -1) {
      return;
    }

    let selected = this.options[index];

    if (this.multiple === false) {
      // this.$focused = index;
      this.$selected = [selected.value];
    } else {
      if (this.$selected.findIndex(a => a === selected?.value) === -1) {
        this.$selected.push(selected?.value);
      } else {
        this.$selected = this.$selected.filter(a => a !== selected?.value);
      }

      this.requestUpdate();
    }

    this.dispatchEvent(
      new CustomEvent('uk-select:input', {
        detail: {
          value: this.multiple === false ? this.$selected[0] : this.$selected,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected override onKeydown(e: KeyboardEvent) {
    if (this.$open === true) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.navigate('d');
          break;

        case 'ArrowUp':
          e.preventDefault();
          this.navigate('t');
          break;

        case 'Enter':
          e.preventDefault();
          this.select(this.$focused);
          break;
      }
    }
  }

  private onInputKeydown(e: KeyboardEvent) {
    this.onKeydown(e);

    if (this.$open === true) {
      switch (e.key) {
        case 'Tab':
          if (!e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
          }
          break;
      }
    }
  }

  protected override _cls(options?: {
    item: GroupedOptionsItem;
    index: number;
  }): {
    parent: string;
    item: string;
    'item-header': string;
    'item-link': string;
    'item-wrapper': string;
    'item-icon': string;
    'item-text': string;
    [key: string]: string;
  } {
    return {
      parent: 'uk-nav uk-dropdown-nav uk-overflow-auto uk-height-max-medium',
      item: options?.item.disabled === true ? 'uk-disabled opacity-50' : '',
      'item-header': 'uk-nav-header',
      'item-link': this.multiple === false ? 'uk-drop-close' : '',
      'item-icon': 'uk-flex-none uk-margin-small-right',
      'item-wrapper': 'uk-flex-1 uk-flex uk-flex-middle',
      'item-text': 'uk-flex-1',
    };
  }

  protected override onClick(options: {
    item: GroupedOptionsItem;
    index: number;
  }): void {
    const { index } = options;

    this.select(index);
  }

  protected override renderCheck(options: {
    item: GroupedOptionsItem;
    index: number;
  }) {
    return this.$selected.includes(options.item.value)
      ? html`
          <uk-icon
            class="uk-margin-small-left uk-flex-none"
            icon="check"
          ></uk-icon>
        `
      : '';
  }

  private renderSearch() {
    return this.searchable === true
      ? html`
          <div class="uk-custom-select-search">
            <uk-icon icon="search"></uk-icon>
            <input
              placeholder=${this.$i18n['search-placeholder']}
              type="text"
              .value="${this.$term}"
              @input="${(e: InputEvent) => {
                const input = e.target as HTMLInputElement;

                this.$term = input.value;
              }}"
              @keydown="${this.onInputKeydown}"
            />
          </div>
          ${Object.keys(this.groupedOptions).length > 0
            ? html`<hr class="uk-hr" />`
            : ''}
        `
      : '';
  }

  private renderHidden() {
    return this.name && this.$selected.length > 0
      ? html`${this.multiple === false
          ? this.renderInput(this.name, this.$selected[0])
          : this.$selected.map(a => this.renderInput(`${this.name}[]`, a))}`
      : '';
  }

  private renderInput(name: string, value: string) {
    return html`<input name="${name}" type="hidden" value="${value}" />`;
  }

  render() {
    return html`
      <div class="uk-position-relative">
        <button
          class="${this.$cls['button']}"
          type="button"
          @keydown="${this.onKeydown}"
        >
          ${this.text}
          ${this._icon === true
            ? html`
                <span class="${this.$cls['icon']}" uk-drop-parent-icon></span>
              `
            : html`
                <uk-icon
                  class="${this.$cls['icon']}"
                  icon="${this.icon}"
                ></uk-icon>
              `}
        </button>
        <div
          class="${`uk-drop uk-dropdown ${this.$cls['dropdown']}`}"
          uk-dropdown="${this.drop}"
        >
          ${this.renderSearch()} ${this.renderList()}
        </div>
        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-select': Select;
  }
}
