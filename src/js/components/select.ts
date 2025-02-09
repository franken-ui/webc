import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { OptionItem } from '../helpers/select';
import { BaseSelect } from './shared/base-select';

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
  icon: string = '';

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

  protected get $text(): string {
    if (this.$selected.length === 0) {
      return this.placeholder !== '' ? this.placeholder : 'Select an option';
    }

    if (this.multiple === false && this.selected) {
      return this.selected.text;
    }

    if (this.$selected.length === 1 && this.selected) {
      return this.selected.text;
    }

    return this.$i18n['selection-count'].replace(
      ':n:',
      this.$selected.length.toString(),
    );
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.hasAttribute('icon')) {
      const icon = this.getAttribute('icon');
      this._icon = icon === '' ? true : (icon as string);
    }

    if (this.hasAttribute('value')) {
      this.$selected = this.value.split(',').map(v => v.trim());

      if (!this.multiple) {
        this.$selected = this.$selected.slice(-1);
      }

      this.updateSelectedFromValues();
    } else {
      let values: string[] = [];

      for (const parent in this._options) {
        const options = this._options[parent].options;

        if (this.multiple) {
          options.forEach(option => {
            if (option.selected) {
              values.push(option.value);
            }
          });
        } else {
          const lastSelected = [...options]
            .reverse()
            .find(option => option.selected);

          if (lastSelected) {
            values = [lastSelected.value];
            this.selected = lastSelected;
            break;
          }
        }
      }

      this.$selected = values;

      // Only update selected for multiple selection mode
      if (this.multiple) {
        this.updateSelectedFromValues();
      }
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

    this.isRendered = true;
  }

  protected select(item: OptionItem): void {
    if (item.disabled) {
      return;
    }

    if (this.multiple) {
      const existingIndex = this.$selected.findIndex(a => a === item?.value);
      if (existingIndex === -1) {
        this.$selected.push(item.value);
      } else {
        this.$selected = this.$selected.filter(a => a !== item.value);
      }

      if (this.$selected.length > 0) {
        this.updateSelectedFromValues();
      }

      this.requestUpdate();
    } else {
      this.$selected = [item.value];
      this.selected = item;
    }

    this.emit();
  }

  private updateSelectedFromValues(): void {
    if (this.$selected.length > 0) {
      const lastValue = this.$selected[this.$selected.length - 1];

      for (const parent in this._options) {
        const lastSelected = this._options[parent].options.find(
          option => option.value === lastValue,
        );

        if (lastSelected) {
          this.selected = lastSelected;

          break;
        }
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

  protected _cls(options?: { item: OptionItem; index: number }): {
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
      parent: 'uk-nav uk-dropdown-nav uk-overflow-auto uk-cs-options',
      item: options?.item.disabled === true ? 'uk-disabled opacity-50' : '',
      'item-header': 'uk-nav-header',
      'item-link': this.multiple === false ? 'uk-drop-close' : '',
      'item-icon': 'uk-cs-item-icon',
      'item-wrapper': 'uk-cs-item-wrapper',
      'item-text': 'uk-cs-item-text',
      'item-subtitle': 'uk-nav-subtitle',
    };
  }

  protected onClick(options: { item: OptionItem; index: number }): void {
    const { item } = options;

    this.select(item);
  }

  protected renderCheck(options: { item: OptionItem; index: number }) {
    if (this.$selected.includes(options.item.value)) {
      return html`<span class="uk-cs-check" data-uk-check></span>`;
    }
  }

  private renderSearch() {
    return this.searchable === true
      ? html`
          <div class="uk-cs-search">
            <span uk-search-icon></span>
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
          ${Object.keys(this.options).length > 0
            ? html`<hr class="uk-hr" />`
            : ''}
        `
      : '';
  }

  protected readonly 'cls-default-element': string = 'button';

  protected readonly 'input-event': string = 'uk-select:input';

  protected readonly 'search-event': string = 'uk-select:search';

  protected get $value(): string | string[] {
    return this.multiple
      ? this.$selected
      : this.$selected.length === 1
        ? this.$selected[0]
        : '';
  }

  protected initializeValue(): void {
    // because of special nature of select component's lifecycle, functionality has moved to connectedCallback() instead
  }

  render() {
    return html`
      <div class="uk-position-relative">
        <button
          class="${this.$cls['button']}"
          type="button"
          .disabled=${this.disabled}
          @keydown="${this.onKeydown}"
        >
          ${this.$text}
          ${this._icon === true
            ? html`
                <span
                  class="${this.$cls['icon']}"
                  data-uk-drop-parent-icon
                ></span>
              `
            : this.icon !== ''
              ? html`
                  <uk-icon
                    class="${this.$cls['icon']}"
                    icon="${this.icon}"
                  ></uk-icon>
                `
              : ''}
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
