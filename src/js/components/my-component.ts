import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { parseOptions } from '../helpers/common';

type Option = {
  group: string;
  value: string;
  text: string;
  disabled: boolean;
  selected: boolean;
  icon: string | null;
};

type DropdownItem = {
  value: string;
  text: string;
  disabled: boolean;
  selected: boolean;
  icon: string | null;
};

type DropdownItems = {
  [key: string]: DropdownItem[];
};

type I18N = {
  'selection-count-text': string;
};

@customElement('my-component')
export class MyComponent extends LitElement {
  @property({ type: String })
  drop: string = 'mode: click';

  @property({ type: Boolean })
  searchable: boolean = false;

  @property({ type: Boolean })
  multiple: boolean = false;

  @property({ type: Boolean })
  reactive = false;

  @property({ type: String })
  placeholder: string = 'Select an option';

  @property({ type: String })
  name: string = '';

  @property({ type: String })
  'cls-button': string = 'uk-input-fake uk-flex uk-flex-between';

  @property({ type: String })
  'cls-dropdown': string = 'uk-width-1-1';

  @property({ type: String })
  i18n: string = '';

  @state()
  $open: boolean = false;

  @state()
  $options: Option[] = [];

  @state()
  $selected: string[] = [];

  @state()
  $term: string = '';

  @state()
  $focused: number = -1;

  @state()
  $i18n: I18N = {
    'selection-count-text': ':n: options selected',
  };

  private selectElement: HTMLSelectElement | null = null;

  private observer: MutationObserver | null = null;

  private dropElement: Element | null = null;

  private navElement: Element | null = null;

  get options(): Option[] {
    if (this.$term) {
      return this.$options.filter(a =>
        a.value.toLowerCase().includes(this.$term.toLowerCase()),
      );
    }

    return this.$options;
  }

  get dropdownItems() {
    const items: DropdownItems = {};

    for (const option of this.options) {
      option['group'] = option.group;

      (items[option.group] = items[option.group] || []).push({
        value: option.value,
        text: option.text,
        disabled: option.disabled,
        selected: option.selected,
        icon: option.icon,
      });
    }

    return items;
  }

  get text() {
    if (this.$selected.length === 0) {
      return this.placeholder !== '' ? this.placeholder : 'Select an option';
    }

    if (this.multiple === false) {
      return this.$options.find(a => a.value === this.$selected[0])?.text;
    }

    if (this.$selected.length === 1) {
      return this.$options.find(a => a.value === this.$selected[0])?.text;
    }

    return this.$i18n['selection-count-text'].replace(
      ':n:',
      this.$selected.length.toString(),
    );
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.i18n) {
      this.$i18n = parseOptions(this.i18n) as I18N;
    }

    this.$selected = this.options
      .filter(a => a.selected === true)
      .map(a => a.value);

    if (this.multiple === false) {
      this.$focused = this.options.findIndex(
        a => a.value === this.$selected[0],
      );
    }

    this.selectElement = this.renderRoot.querySelector('select');

    if (this.selectElement) {
      this.createOptions();

      if (this.reactive) {
        this.observer = new MutationObserver(() => {
          this.createOptions();
          this.requestUpdate();
        });

        this.observer.observe(this.selectElement, {
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

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.dropElement = this.renderRoot.querySelector('.uk-drop');
    this.navElement = this.dropElement?.querySelector('ul') as Element;

    window.UIkit.util.on(this.dropElement, 'hidden', () => {
      this.$open = false;
    });

    window.UIkit.util.on(this.dropElement, 'shown', () => {
      this.$open = true;
    });
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('$term')) {
      this.updateComplete.then(() => {
        this.$focused = -1;
      });
    }
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private createOptions() {
    if (this.selectElement) {
      this.$options = [];

      const add = (
        group: string,
        option: HTMLOptionElement,
        isOptGroupDisabled?: boolean | undefined,
      ) => {
        if (option.hasAttribute('selected')) {
          if (this.multiple === false) {
            this.$selected = [option.value];
          } else {
            this.$selected.push(option.value);
          }
        }

        let value: string | undefined;

        if (option.hasAttribute('value')) {
          value = option.getAttribute('value') as string;
        } else {
          value = option.textContent as string;
        }

        this.$options.push({
          group: group,
          value: value,
          text: option.textContent as string,
          disabled: isOptGroupDisabled === true ? true : option.disabled,
          selected: option.selected,
          icon: option.getAttribute('data-icon'),
        });
      };

      Array.from(this.selectElement.children).map(a => {
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

  private navigate(direction: 't' | 'd') {
    this.navElement
      ?.querySelector('li.uk-active')
      ?.classList.remove('uk-active');

    const count =
      (this.navElement?.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>)
        .length - 1;

    if (direction === 'd') {
      if (this.$focused < count) {
        this.$focused++;
      } else {
        this.$focused = 0;
      }
    }

    if (direction === 't') {
      if (this.$focused === 0) {
        this.$focused = count;
      } else {
        this.$focused--;
      }
    }

    const activeElement = this.navElement
      ?.querySelectorAll('a')
      [this.$focused].closest('li') as HTMLElement;

    this.focusActiveElement(activeElement);

    activeElement.classList.add('uk-active');
  }

  private focusActiveElement(element: HTMLElement) {
    const rects = {
      ul: (this.navElement as HTMLElement).getBoundingClientRect(),
      li: element.getBoundingClientRect(),
    };
    const scrollTop =
      element.offsetTop -
      (this.navElement as HTMLElement).offsetTop -
      rects.ul.height / 2 +
      rects.li.height / 2;

    this.navElement?.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    });
  }

  private select(index: number) {
    if (index === -1) {
      return;
    }

    let selected = this.$options[index];

    if (this.multiple === false) {
      this.$focused = index;
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

  private onButtonKeydown(e: KeyboardEvent) {
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

        default:
          break;
      }
    }
  }

  private onInputKeydown(e: KeyboardEvent) {
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

      case 'Tab':
        if (!e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
        break;

      default:
        break;
    }
  }

  private renderSearch() {
    return html`
      <div class="uk-custom-select-search">
        <uk-icon icon="search"></uk-icon>
        <input
          placeholder="Search"
          type="text"
          .value="${this.$term}"
          @input="${(e: InputEvent) => {
            const input = e.target as HTMLInputElement;

            this.$term = input.value;
          }}"
          @keydown="${this.onInputKeydown}"
        />
      </div>
    `;
  }

  private renderDropdownItem(item: DropdownItem, index: number) {
    return html`
      <li class="${item.disabled === true ? 'uk-disabled opacity-50' : ''}">
        <a
          class="${this.multiple === false ? 'uk-drop-close' : ''}"
          tabindex="-1"
          @click=${() => this.select(index)}
        >
          <div class="uk-flex-1 uk-flex uk-flex-middle">
            ${item.icon
              ? html`
                  <uk-icon
                    class="uk-flex-none uk-margin-small-right"
                    icon="${item.icon}"
                  ></uk-icon>
                `
              : ''}
            <span class="uk-flex-1">${item.text}</span>
          </div>
          ${this.$selected.includes(item.value)
            ? html` <uk-icon class="uk-flex-none" icon="check"></uk-icon> `
            : ''}
        </a>
      </li>
    `;
  }

  private renderDropdownItems() {
    return Object.keys(this.dropdownItems).length > 0
      ? html`
          ${this.searchable === true ? html`<hr class="uk-hr" />` : ''}
          <ul
            class="uk-nav uk-dropdown-nav uk-overflow-auto uk-height-small"
            tabindex="-1"
          >
            ${repeat(
              Object.keys(this.dropdownItems),
              (a, _) => html`
                ${a !== '__' ? html`<li class="uk-nav-header">${a}</li>` : ''}
                ${repeat(this.dropdownItems[a], (b, i) =>
                  this.renderDropdownItem(b, i),
                )}
              `,
            )}
          </ul>
        `
      : '';
  }

  private renderHiddenInputs() {
    return this.name && this.$selected.length > 0
      ? html`${this.multiple === false
          ? html`
              <input
                name="${this.name}"
                type="hidden"
                value="${this.$selected[0]}"
              />
            `
          : this.$selected.map(
              a => html`
                <input name="${this.name}[]" type="hidden" value="${a}" />
              `,
            )}`
      : '';
  }

  render() {
    return html`
      <div class="uk-position-relative">
        <button
          class="${this['cls-button']}"
          type="button"
          @keydown="${this.onButtonKeydown}"
        >
          ${this.text}
        </button>
        <div
          class="${`uk-drop uk-dropdown ${this['cls-dropdown']}`}"
          uk-dropdown="${this.drop}"
        >
          ${this.searchable === true ? this.renderSearch() : ''}
          ${this.renderDropdownItems()}
        </div>
        ${this.renderHiddenInputs()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-component': MyComponent;
  }
}
