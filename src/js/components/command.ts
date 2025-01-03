import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseSelect, GroupedOptionsItem } from './shared/base-select';

@customElement('uk-command')
export class Command extends BaseSelect {
  @property({ type: String })
  key: string | undefined;

  @property({ type: String })
  placeholder: string = 'Search';

  @property({ type: String })
  toggle: string = 'fkcmd';

  private HTMLModal: Element | null = null;

  constructor() {
    super();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.HTMLModal = this.renderRoot.querySelector('.uk-modal');

    if (this.HTMLModal) {
      this.HTMLRectParent = this.renderRoot.querySelector('ul');

      if (this.key !== undefined) {
        document.addEventListener('keydown', e => {
          if (e.ctrlKey && e.key === this.key) {
            e.preventDefault();
            window.UIkit.modal(this.HTMLModal).toggle();
          }
        });
      }

      window.UIkit.util.on(this.HTMLModal, 'hidden', () => {
        this.$focused = -1;
        this.$term = '';
      });
    }

    this._rendered = true;
  }

  protected override onKeydown(e: KeyboardEvent) {
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

      default:
        break;
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
      parent: 'uk-overflow-auto uk-nav uk-nav-secondary uk-cmd-body',
      item: options?.item.disabled === true ? 'uk-disabled opacity-50' : '',
      'item-header': 'uk-nav-header',
      'item-link': options?.item.disabled === false ? 'uk-modal-close' : '',
      'item-icon': 'uk-cmd-item-icon',
      'item-wrapper': 'uk-cmd-item-wrapper',
      'item-text': 'uk-cmd-item-text',
    };
  }

  protected override onClick(options: {
    item: GroupedOptionsItem;
    index: number;
  }): void {
    const { item } = options;

    const index = this.options.findIndex(a => a.value === item.value);

    this.select(index);
  }

  private select(index: number): void {
    if (index === -1) {
      return;
    }

    let selected = this.options[index];

    if (selected.disabled) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent('uk-command:click', {
        detail: {
          value: selected,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderSearch() {
    return html`
      <div class="uk-cmd-header">
        <div class="uk-cmd-header-icon">
          <span uk-search-icon></span>
        </div>
        <div class="uk-cmd-header-input">
          <input
            autofocus
            placeholder="${this.placeholder}"
            type="text"
            .value="${this.$term}"
            @keydown=${this.onKeydown}
            @input=${(e: InputEvent) => {
              const input = e.target as HTMLInputElement;

              this.$term = input.value;
            }}
          />
        </div>
        <div class="uk-cmd-header-esc">
          <button class="uk-btn uk-btn-sm uk-btn-default uk-modal-close">
            Esc
          </button>
        </div>
      </div>
      ${Object.keys(this.groupedOptions).length > 0
        ? html`<hr class="uk-hr" />`
        : ''}
    `;
  }

  render() {
    return html`
      <div class="uk-modal uk-flex-top" id="${this.toggle}" uk-modal>
        <div class="uk-modal-dialog uk-margin-auto-vertical">
          ${this.renderSearch()} ${this.renderList()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-command': Command;
  }
}
