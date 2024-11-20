import { html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

export type OptionData = { keywords: string[]; [key: string]: any };

export type Option = {
  group: string;
  value: string;
  text: string;
  disabled: boolean;
  selected: boolean;
  data: OptionData;
};

export type GroupedOptionsItem = {
  value: string;
  text: string;
  disabled: boolean;
  selected: boolean;
  data: OptionData;
};

export type GroupedOptions = {
  [key: string]: GroupedOptionsItem[];
};

export class BaseSelect extends LitElement {
  @property({ type: Boolean })
  reactive: boolean = false;

  @state()
  $term: string = '';

  @state()
  $focused: number = -1;

  @state()
  $open: boolean = false;

  protected _options: Option[] = [];

  get options(): Option[] {
    if (this.$term) {
      return this._options.filter(a =>
        a.data.keywords.some(keyword =>
          keyword.toLowerCase().includes(this.$term.toLowerCase()),
        ),
      );
    }

    return this._options;
  }

  get groupedOptions() {
    const groupedOptions: GroupedOptions = {};

    for (const option of this.options) {
      option['group'] = option.group;

      (groupedOptions[option.group] = groupedOptions[option.group] || []).push({
        value: option.value,
        text: option.text,
        disabled: option.disabled,
        selected: option.selected,
        data: option.data,
      });
    }

    return groupedOptions;
  }

  protected HTMLSelect: HTMLSelectElement | null = null;

  protected HTMLRectParent: HTMLElement | null = null;

  protected HTMLRectActive: HTMLElement | null = null;

  protected observer: MutationObserver | null = null;

  connectedCallback(): void {
    super.connectedCallback();

    this.HTMLSelect = this.renderRoot.querySelector('select');

    if (this.HTMLSelect) {
      this.createOptions();

      if (this.reactive) {
        this.observer = new MutationObserver(() => {
          this.createOptions();
          this.requestUpdate();
        });

        this.observer.observe(this.HTMLSelect, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true,
        });
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.observer) {
      this.observer.disconnect();

      this.observer = null;
    }
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (
      _changedProperties.has('$term') &&
      _changedProperties.get('$term') !== undefined
    ) {
      this.updateComplete.then(() => {
        this.$focused = -1;
      });
    }

    if (_changedProperties.has('$focused')) {
      if (this.HTMLRectParent) {
        this.HTMLRectParent.querySelector('li.uk-active')?.classList.remove(
          'uk-active',
        );

        this.HTMLRectActive =
          this.HTMLRectParent.querySelectorAll('a')[this.$focused];

        if (this.HTMLRectActive) {
          this.focusActiveOption();

          this.HTMLRectActive.closest('li')?.classList.add('uk-active');
        }
      }
    }
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected createOptions() {
    if (this.HTMLSelect) {
      this._options = [];

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

        const data: OptionData = { keywords: [] };

        data['keywords'] = [value];

        Object.keys(option.dataset).forEach(attr => {
          if (attr !== 'keywords') {
            data[attr] = option.dataset[attr];
          } else {
            data['keywords'] = [
              value,
              ...(option.getAttribute('data-keywords') as string).split(','),
            ];
          }
        });

        this._options.push({
          group: group,
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

        if (a.nodeName === 'OPTION') {
          const option = a as HTMLOptionElement;

          add('__', option);
        }
      });
    }
  }

  protected navigate(direction: 't' | 'd') {
    const count = this.options.length - 1;

    switch (direction) {
      case 't':
        if (direction === 't') {
          if (this.$focused === 0) {
            this.$focused = count;
          } else {
            this.$focused--;
          }
        }
        break;

      case 'd':
        if (this.$focused < count) {
          this.$focused++;
        } else {
          this.$focused = 0;
        }
        break;
    }
  }

  protected focusActiveOption(behavior: ScrollBehavior = 'smooth') {
    if (this.HTMLRectParent && this.HTMLRectActive) {
      const rects = {
        parent: this.HTMLRectParent.getBoundingClientRect(),
        active: this.HTMLRectActive.getBoundingClientRect(),
      };

      this.HTMLRectParent.scrollTo({
        top:
          this.HTMLRectActive.offsetTop -
          this.HTMLRectParent.offsetTop -
          rects.parent.height / 2 +
          rects.active.height / 2,
        behavior: behavior,
      });
    }
  }

  protected _cls(options?: { item: GroupedOptionsItem; index: number }): {
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
      parent: 'uk-nav',
      item: options?.item.disabled === true ? 'uk-disabled opacity-50' : '',
      'item-header': 'uk-nav-header',
      'item-link': '',
      'item-icon': 'uk-flex-none uk-margin-small-right',
      'item-wrapper': 'uk-flex-1 uk-flex uk-flex-middle',
      'item-text': 'uk-flex-1',
    };
  }

  protected onClick(_: { item: GroupedOptionsItem; index: number }): void {}

  protected onKeydown(_: KeyboardEvent) {}

  protected renderCheck(_: {
    item: GroupedOptionsItem;
    index: number;
  }): TemplateResult | string {
    return html``;
  }

  protected renderList() {
    const cls = this._cls();

    return html`
      <ul class="${cls['parent']}" tabindex="-1" @keydown="${this.onKeydown}">
        ${repeat(
          Object.keys(this.groupedOptions),
          (a, _) => html`
            ${this.renderListHeader(a)}
            ${repeat(this.groupedOptions[a], (b, i) =>
              this.renderListItem(b, i),
            )}
          `,
        )}
      </ul>
    `;
  }

  protected renderListHeader(header: string) {
    const cls = this._cls();

    return header !== '__'
      ? html`<li class="${cls['item-header']}">${header}</li>`
      : '';
  }

  protected renderListItem(item: GroupedOptionsItem, index: number) {
    const cls = this._cls({ item, index });

    return html`
      <li class="${cls['item']}">
        <a
          @click="${() => this.onClick({ item, index })}"
          class="${cls['item-link']}"
          tabindex="-1"
        >
          <div class="${cls['item-wrapper']}">
            ${item.data.icon
              ? html`
                  <uk-icon
                    class="${cls['item-icon']}"
                    icon="${item.data.icon}"
                  ></uk-icon>
                `
              : ''}
            ${item.data.description
              ? html`
                  <div>
                    <span class="${cls['item-text']}">${item.text}</span>
                    <div class="uk-nav-subtitle">${item.data.description}</div>
                  </div>
                `
              : html`<span class="${cls['item-text']}">${item.text}</span>`}
          </div>
          ${this.renderCheck({ item, index })}
        </a>
      </li>
    `;
  }
}
