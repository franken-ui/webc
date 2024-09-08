import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

@customElement('uk-command')
export class Command extends LitElement {
  @property({ type: String })
  key: string | undefined;

  @property({ type: String })
  placeholder: string = 'Search';

  @property({ type: String })
  toggle: string = 'fkcmd';

  @state()
  $items: {
    [key: string]: any[];
  } = {};

  @state()
  $filteredItems = this.$items;

  @state()
  $term: string = '';

  @state()
  $focused: number = -1;

  get flattenedItems() {
    return Object.values(this.$filteredItems).flat();
  }

  connectedCallback(): void {
    super.connectedCallback();

    Array.from(this.children).map((a: Element) => {
      if (a.nodeName === 'A') {
        const group = a.hasAttribute('data-group')
          ? (a.getAttribute('data-group') as string)
          : '__';

        if (this.$items[group] === undefined) {
          this.$items[group] = [];
        }

        let keywords = [a.textContent?.toLocaleLowerCase().trim()];

        if (a.hasAttribute('data-keywords')) {
          const _keywords = a
            .getAttribute('data-keywords')
            ?.split(',')
            .map(a => a.trim())
            .filter(a => a !== '') as string[];

          keywords = [...keywords, ..._keywords];
        }

        this.$items[group].push({
          disabled:
            a.hasAttribute('href') === false || a.getAttribute('href') === ''
              ? true
              : false,
          element: a.outerHTML,
          keywords: keywords,
        });
      }
    });

    if (this.key !== undefined && window.UIkit) {
      document.addEventListener('keydown', this.onKeydown.bind(this));
    }

    if (this.hasAttribute('toggle') === false) {
      console.error(
        'To suppress this message, set the `toggle` attribute to a unique name on your `<uk-command>`. Please see https://franken-ui.dev/docs/command for more details.',
      );
    }

    this.innerHTML = '';
    this.removeAttribute('uk-cloak');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('$focused')) {
      const e = document.getElementById(this.toggle);

      if (e) {
        const ul = e.querySelector('ul');

        if (ul) {
          const li = ul.querySelectorAll('li');

          li.forEach(li => {
            li.classList.remove('uk-active');
          });

          const options = Array.from(li).filter(
            li => !li.classList.contains('uk-nav-header'),
          );

          if (this.$focused >= 0 && this.$focused < options.length) {
            const focused = options[this.$focused];

            focused.classList.add('uk-active');

            const rects = {
              ul: ul.getBoundingClientRect(),
              li: focused.getBoundingClientRect(),
            };
            const scrollTop =
              focused.offsetTop -
              ul.offsetTop -
              rects.ul.height / 2 +
              rects.li.height / 2;

            ul.scrollTo({
              top: scrollTop,
              behavior: 'smooth',
            });
          }
        }
      }
    }

    if (_changedProperties.has('$term')) {
      this.updateComplete.then(() => {
        this.$focused = -1;

        if (this.$term === '') {
          this.$filteredItems = this.$items;

          return;
        }

        this.$filteredItems = Object.fromEntries(
          Object.entries(this.$items).map(([key, value]) => [
            key,
            value.filter(item =>
              item.keywords.some((keyword: string) =>
                keyword.toLowerCase().includes(this.$term.toLowerCase()),
              ),
            ),
          ]),
        );
      });
    }
  }

  private navigate(direction: 'up' | 'down') {
    const isValidOption = (item: any) => item.disabled !== true;

    let focused = this.$focused;
    const increment = direction === 'up' ? -1 : 1;

    do {
      focused += increment;

      if (focused < 0) {
        // If we've gone past the start, find the last valid option
        focused = this.flattenedItems.length - 1;
        while (focused >= 0 && !isValidOption(this.flattenedItems[focused])) {
          focused--;
        }
        break;
      } else if (focused >= this.flattenedItems.length) {
        // If we've gone past the end, find the first valid option
        focused = 0;
        while (
          focused < this.flattenedItems.length &&
          !isValidOption(this.flattenedItems[focused])
        ) {
          focused++;
        }
        break;
      }
    } while (!isValidOption(this.flattenedItems[focused]));

    return focused;
  }

  private go() {
    const e = document.getElementById(this.toggle);

    if (e) {
      const ul = e.querySelector('ul');

      if (ul) {
        const li = ul.querySelectorAll('li');
        const options = Array.from(li).filter(
          li => !li.classList.contains('uk-nav-header'),
        );

        if (options[this.$focused]) {
          const a = options[this.$focused].querySelector(
            'a',
          ) as HTMLAnchorElement;

          a.click();
        }
      }
    }
  }

  render() {
    return html`
      <div id=${this.toggle} class="uk-modal uk-flex-top" uk-modal>
        <div class="uk-margin-auto-vertical uk-modal-dialog">
          <div class="uk-inline uk-width-1-1">
            <span class="uk-form-icon uk-form-icon-flip uk-text-muted">
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
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              autofocus
              class="uk-input uk-form-blank"
              placeholder="${this.placeholder}"
              type="text"
              @keydown=${(e: KeyboardEvent) => {
                switch (e.key) {
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
                    this.go();
                    break;

                  default:
                    break;
                }
              }}
              @input=${(e: InputEvent) => {
                const input = e.target as HTMLInputElement;

                this.$term = input.value;
              }}
            />
          </div>
          <hr class="uk-hr" />
          <ul class="uk-height-medium uk-overflow-auto uk-nav uk-nav-secondary">
            ${repeat(
              Object.entries(this.$filteredItems),
              ([key]) => key,
              ([key, items]) =>
                items.length
                  ? html`
                      ${key !== '__'
                        ? html`<li class="uk-nav-header">${key}</li>`
                        : ''}
                      ${repeat(
                        items,
                        (_, index) => index,
                        item => html`
                          <li
                            class="${item.disabled === true
                              ? 'uk-disabled opacity-50'
                              : ''}"
                          >
                            ${unsafeHTML(item.element)}
                          </li>
                        `,
                      )}
                    `
                  : '',
            )}
          </ul>
        </div>
      </div>
    `;
  }

  onKeydown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === this.key) {
      e.preventDefault();
      window.UIkit.modal(`#${this.toggle}`).toggle();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-command': Command;
  }
}
