import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { parseOptions } from '../../helpers/common';

type Option = {
  type: 'option' | 'label';
  value?: string;
  text: string;
  disabled?: boolean;
  selected?: boolean;
};

type I18N = {
  'selection-count-text': string;
};

@customElement('uk-select')
export class Select extends LitElement {
  @property({ type: String })
  name: string = '';

  @property({ type: Boolean })
  multiple: boolean = false;

  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: String })
  placeholder: string = '';

  @property({ type: Boolean })
  searchable: boolean = false;

  @property({ type: Boolean })
  error: boolean = false;

  @property({ type: String })
  i18n: string = '';

  @state()
  $term: string = '';

  @state()
  $options: Option[] = [];

  @state()
  $filteredOptions: Option[] = this.$options;

  @state()
  $focused: number = -1;

  @state()
  $selected: any[] = [];

  @state()
  $isOpen: Boolean = false;

  @state()
  $i18n: I18N = {
    'selection-count-text': ':n: options selected',
  };

  private navigate(direction: 'up' | 'down') {
    const isValidOption = (item: Option) =>
      item.type !== 'label' && item.disabled !== true;

    let focused = this.$focused;
    const increment = direction === 'up' ? -1 : 1;

    do {
      focused += increment;

      if (focused < 0) {
        // If we've gone past the start, find the last valid option
        focused = this.$filteredOptions.length - 1;
        while (focused >= 0 && !isValidOption(this.$filteredOptions[focused])) {
          focused--;
        }
        break;
      } else if (focused >= this.$filteredOptions.length) {
        // If we've gone past the end, find the first valid option
        focused = 0;
        while (
          focused < this.$filteredOptions.length &&
          !isValidOption(this.$filteredOptions[focused])
        ) {
          focused++;
        }
        break;
      }
    } while (!isValidOption(this.$filteredOptions[focused]));

    return focused;
  }

  private addOption(
    option: HTMLOptionElement,
    isOptGroupDisabled?: boolean | undefined,
  ) {
    if (option.selected === true) {
      if (this.multiple === false) {
        this.$selected = [option.value];
      } else {
        this.$selected.push(option.value);
      }
    }

    let value: string | undefined;

    if (option.hasAttribute('value')) {
      value = option.getAttribute('value') || '';
    } else {
      value = option.textContent || '';
    }

    this.$options.push({
      type: 'option',
      value: value,
      text: option.textContent || '',
      disabled: isOptGroupDisabled === true ? true : option.disabled,
      selected: option.selected,
    });
  }

  connectedCallback(): void {
    super.connectedCallback();

    Array.from(this.children).map(a => {
      if (a.nodeName === 'OPTGROUP') {
        const group = a as HTMLOptGroupElement;

        this.$options.push({
          type: 'label',
          text: group.getAttribute('label') || '',
        });

        Array.from(group.children).map(b => {
          const option = b as HTMLOptionElement;

          this.addOption(option, group.disabled);
        });
      }

      if (a.nodeName === 'OPTION') {
        const option = a as HTMLOptionElement;

        this.addOption(option);
      }
    });

    // scroll the ul tag once page load
    if (this.multiple === false && this.$selected.length === 1) {
      this.$focused = this.$options.findIndex(
        a => a.value === this.$selected[0],
      );
    }

    if (this.i18n) {
      this.$i18n = parseOptions(this.i18n) as I18N;
    }

    document.addEventListener('click', this.onClickAway.bind(this));

    this.innerHTML = '';
    this.removeAttribute('uk-cloak');
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener('click', this.onClickAway);
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('$focused')) {
      if (this.$isOpen === true) {
        this.focusLi();
      }
    }

    if (_changedProperties.has('$isOpen')) {
      if (this.$isOpen === true) {
        this.focusLi(false);

        const windowHeight = window.innerHeight;
        const dropdown = this.renderRoot.querySelector(
          'div.uk-dropdown',
        ) as HTMLElement;
        const button = this.renderRoot.querySelector('button') as HTMLElement;

        const rects = {
          dropdown: dropdown.getBoundingClientRect(),
          button: button.getBoundingClientRect(),
        };

        if (rects.button.bottom + rects.dropdown?.height > windowHeight) {
          dropdown.style.bottom = `${rects.button.height + 4}px`;
        }

        this.dispatchEvent(
          new CustomEvent('uk-select:shown', {
            detail: { value: true },
            bubbles: true,
            composed: true,
          }),
        );
      } else {
        this.updateComplete.then(() => {
          this.$term = '';

          if (this.multiple === false) {
            this.$focused = this.$options.findIndex(
              a => a.value === this.$selected[0],
            );
          } else {
            this.$focused = -1;
          }
        });

        this.dispatchEvent(
          new CustomEvent('uk-select:hidden', {
            detail: { value: true },
            bubbles: true,
            composed: true,
          }),
        );
      }
    }

    if (_changedProperties.has('$term')) {
      this.updateComplete.then(() => {
        if (this.$term === '') {
          this.$filteredOptions = this.$options;

          return;
        }

        this.$filteredOptions = this.$options.filter(a =>
          a.value?.toLowerCase().includes(this.$term.toLowerCase()),
        );
      });
    }
  }

  render() {
    return html`
      <div class="uk-combobox">
        <button
          class="uk-combobox-input ${this.error === true
            ? 'uk-form-danger'
            : ''}"
          type="button"
          .disabled=${this.disabled}
          @click="${this.toggle}"
          @keydown=${(e: KeyboardEvent) => {
            if (this.$isOpen === true) {
              switch (e.key) {
                case 'Escape':
                  this.$isOpen = false;
                  break;

                case 'ArrowDown':
                  e.preventDefault();
                  this.$focused = this.navigate('down');
                  break;

                case 'ArrowUp':
                  e.preventDefault();
                  this.$focused = this.navigate('up');
                  break;

                case 'Enter':
                  e.preventDefault();
                  this.select(this.$focused);
                  break;

                case ' ':
                  e.preventDefault();
                  this.select(this.$focused);
                  break;

                case 'Tab':
                  if (this.searchable === false) {
                    this.$isOpen = false;
                  }
                  break;

                default:
                  break;
              }
            } else {
              switch (e.key) {
                case 'ArrowDown':
                  e.preventDefault();
                  this.$focused = this.navigate('down');
                  this.$isOpen = true;
                  break;

                case 'ArrowUp':
                  e.preventDefault();
                  this.$focused = this.navigate('up');
                  this.$isOpen = true;
                  break;
              }
            }
          }}
        >
          <span> ${this.text()} </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-chevrons-up-down"
          >
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </button>
        ${this.$isOpen === true
          ? html`<div class="uk-drop uk-dropdown uk-open" tabindex="-1">
              ${this.searchable === true
                ? html`<div class="uk-combobox-search">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-search"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                      placeholder="Search"
                      type="text"
                      .value="${this.$term}"
                      @keydown=${(e: KeyboardEvent) => {
                        if (this.$isOpen === true) {
                          switch (e.key) {
                            case 'Escape':
                              this.$isOpen = false;
                              this.renderRoot.querySelector('button')?.focus();
                              break;

                            case 'ArrowDown':
                              e.preventDefault();
                              this.$focused = this.navigate('down');
                              break;

                            case 'ArrowUp':
                              e.preventDefault();
                              this.$focused = this.navigate('up');
                              break;

                            case 'Enter':
                              e.preventDefault();
                              this.select(this.$focused);
                              break;

                            case 'Tab':
                              if (
                                !e.altKey &&
                                !e.shiftKey &&
                                !e.ctrlKey &&
                                !e.metaKey
                              ) {
                                this.$isOpen = false;
                              }
                              break;

                            default:
                              break;
                          }
                        }
                      }}
                      @input=${(e: InputEvent) => {
                        const input = e.target as HTMLInputElement;

                        this.$term = input.value;
                      }}
                    />
                  </div>`
                : ''}
              <ul class="uk-dropdown-nav" tabindex="-1">
                ${repeat(
                  this.$filteredOptions,
                  option => option.value,
                  (option, index) =>
                    html`${option.type === 'label'
                      ? html`<li class="uk-nav-header">${option.text}</li>`
                      : html`<li
                          class="${option.disabled === true
                            ? 'uk-disabled'
                            : ''} ${this.$focused === index ? 'uk-active' : ''}"
                          tabindex="-1"
                          @click=${() => this.select(index)}
                        >
                          <a tabindex="-1">
                            <span>${option.text}</span>
                            ${this.$selected.includes(option.value)
                              ? html`<svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  class="lucide lucide-check"
                                >
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>`
                              : ''}
                          </a>
                        </li>`}`,
                )}
              </ul>
            </div>`
          : ''}
        ${this.name
          ? html`${this.multiple === false
              ? html`<input
                  name="${this.name}"
                  type="hidden"
                  value="${this.$selected[0]}"
                />`
              : this.$selected.map(
                  a =>
                    html`<input
                      name="${this.name}[]"
                      type="hidden"
                      value="${a}"
                    />`,
                )}`
          : ''}
      </div>
    `;
  }

  private text() {
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

  private toggle() {
    if (this.$options.length === 0) {
      return;
    }

    this.$isOpen = !this.$isOpen;
  }

  private focusLi(smooth = true) {
    const ul = this.renderRoot.querySelector('ul');

    if (ul) {
      const options = ul.querySelectorAll('li');

      if (this.$focused >= 0 && this.$focused < options.length) {
        const focused = options[this.$focused];
        const rects = {
          ul: ul.getBoundingClientRect(),
          li: focused.getBoundingClientRect(),
        };
        const scrollTop =
          focused.offsetTop -
          ul.offsetTop -
          rects.ul.height / 2 +
          rects.li.height / 2;

        if (smooth === true) {
          ul.scrollTo({
            top: scrollTop,
            behavior: 'smooth',
          });
        } else {
          ul.scrollTop = scrollTop;
        }
      }
    }
  }

  private select(index: number | undefined) {
    if (index === -1) {
      this.$isOpen = false;
      this.renderRoot.querySelector('button')?.focus();

      return;
    }

    let selected: Option | null = null;

    if (index !== undefined) {
      selected = this.$filteredOptions[index];
    }

    if (selected && (selected.type === 'label' || selected.disabled === true)) {
      return;
    }

    if (this.multiple === false) {
      if (index !== undefined) {
        this.$focused = index;
        this.$selected = [selected?.value];
      }

      this.$isOpen = false;
      this.renderRoot.querySelector('button')?.focus();

      this.dispatchEvent(
        new CustomEvent('uk-select:input', {
          detail: { value: this.$selected[0] },
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      if (index !== undefined) {
        if (this.$selected.findIndex(a => a === selected?.value) === -1) {
          this.$selected.push(selected?.value);
        } else {
          this.$selected = this.$selected.filter(a => a !== selected?.value);
        }

        this.requestUpdate();
      }

      this.dispatchEvent(
        new CustomEvent('uk-select:input', {
          detail: { value: this.$selected },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private onClickAway(e: any) {
    if (this.$isOpen && !this.renderRoot.contains(e.target)) {
      this.$isOpen = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-select': Select;
  }
}
