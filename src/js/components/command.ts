import { html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { OptionItem } from '../helpers/select';
import { BaseSelect } from './shared/base-select';

@customElement('uk-command')
export class Command extends BaseSelect {
  @property({ type: String })
  key: string | undefined;

  @property({ type: String })
  toggle: string = '';

  @state()
  $open: boolean = true;

  private HTMLModal: Element | null = null;

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

    this.isRendered = true;
  }

  protected readonly 'search-event': string = 'uk-command:search';

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
      parent: 'uk-overflow-auto uk-nav uk-nav-secondary uk-cmd-body',
      item: options?.item.disabled === true ? 'uk-disabled opacity-50' : '',
      'item-header': 'uk-nav-header',
      'item-link': options?.item.disabled === false ? 'uk-modal-close' : '',
      'item-icon': 'uk-cmd-item-icon',
      'item-wrapper': 'uk-cmd-item-wrapper',
      'item-text': 'uk-cmd-item-text',
      'item-subtitle': 'uk-nav-subtitle',
    };
  }

  protected onClick(options: { item: OptionItem; index: number }): void {
    const { item } = options;

    this.select(item);
  }

  protected onKeydownEnter(): void {
    const dataset = this.HTMLRectActive?.dataset;

    if (dataset) {
      const key: string = dataset.key as string;
      const index: number = dataset.index as unknown as number;

      this.select(this.options[key].options[index]);
    }
  }

  protected select(item: OptionItem) {
    if (item.disabled) {
      return;
    }

    window.UIkit.modal(this.HTMLModal).hide();

    this.dispatchEvent(
      new CustomEvent('uk-command:click', {
        detail: {
          value: item,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected renderCheck(_: {
    item: OptionItem;
    index: number;
  }): TemplateResult | undefined {
    return;
  }

  protected get $value(): string | string[] {
    return '';
  }
  protected get $text(): string {
    return '';
  }
  protected 'input-event': string = '';

  protected initializeValue(): void {}

  protected readonly 'cls-default-element' = '';

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
      ${Object.keys(this.options).length > 0 ? html`<hr class="uk-hr" />` : ''}
    `;
  }

  render() {
    if (
      this['force-prevent-rerender'] &&
      !!this.renderRoot.querySelector('[data-host-inner]')
    ) {
      return;
    }

    return html`
      <div
        data-host-inner
        class="uk-modal uk-flex-top"
        id="${this.toggle}"
        data-uk-modal
      >
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
