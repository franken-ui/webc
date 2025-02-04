import { property, state } from 'lit/decorators.js';
import { Input } from './input';
import { html, PropertyValues, TemplateResult } from 'lit';
import { OptionGrouped, OptionItem, selectToJson } from '../../helpers/select';
import { repeat } from 'lit/directives/repeat.js';

export abstract class BaseSelect extends Input {
  protected abstract readonly 'search-event': string;

  @property({ type: Boolean })
  reactive: boolean = false;

  @state()
  $term: string = '';

  @state()
  $focused: number = -1;

  @state()
  $open: boolean = false;

  protected HTMLSelect: HTMLSelectElement | null = null;

  protected HTMLRectParent: HTMLElement | null = null;

  protected HTMLRectActive: HTMLElement | null = null;

  protected observer: MutationObserver | null = null;

  protected isRendered: boolean = false;

  protected _options: OptionGrouped = {};

  protected selected: OptionItem | null = null;

  get options() {
    const options: OptionGrouped = {};

    Object.entries(this._options).forEach(([key, group]) => {
      const filtered = group.options.filter(option =>
        option.data.keywords?.some(k =>
          k.toLowerCase().includes(this.$term.toLowerCase()),
        ),
      );

      if (filtered.length > 0) {
        options[key] = {
          text: group.text,
          options: filtered,
        };
      }
    });

    return options;
  }

  get count() {
    let total = 0;

    for (const parent in this.options) {
      const count = this.options[parent].options.length;
      total += count;
    }

    return total - 1;
  }

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
      this.dispatchEvent(
        new CustomEvent(this['search-event'], {
          detail: {
            value: this.$term,
          },
          bubbles: true,
          composed: true,
        }),
      );

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

  protected createOptions() {
    if (this.reactive === false && this.isRendered === true) {
      return;
    }

    if (this.HTMLSelect) {
      this._options = selectToJson(this.HTMLSelect);
    }
  }

  protected navigate(direction: 't' | 'd') {
    switch (direction) {
      case 't':
        if (direction === 't') {
          if (this.$focused <= 0) {
            this.$focused = this.count;
          } else {
            this.$focused--;
          }
        }
        break;

      case 'd':
        if (this.$focused < this.count) {
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

  protected abstract _cls(options?: { item: OptionItem; index: number }): {
    parent: string;
    item: string;
    'item-header': string;
    'item-link': string;
    'item-wrapper': string;
    'item-icon': string;
    'item-text': string;
    [key: string]: string;
  };

  protected abstract onClick(_: { item: OptionItem; index: number }): void;

  protected abstract select(item: OptionItem): void;

  protected onKeydown(e: KeyboardEvent) {
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

          if (this.$focused === -1) {
            return;
          }

          const dataset = this.HTMLRectActive?.dataset;

          if (dataset) {
            const key: string = dataset.key as string;
            const index: number = dataset.index as unknown as number;

            this.select(this.options[key].options[index]);
          }

          break;
      }
    }
  }

  protected abstract renderCheck(_: {
    item: OptionItem;
    index: number;
  }): TemplateResult | undefined;

  protected renderList() {
    const cls = this._cls();

    return html`
      <ul class="${cls['parent']}" tabindex="-1" @keydown="${this.onKeydown}">
        ${repeat(
          Object.keys(this.options),
          (a, _) => html`
            ${this.renderListHeader(a)}
            ${repeat(this.options[a].options, (b, i) =>
              this.renderListItem(a, b, i),
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

  protected renderListItem(key: string, item: OptionItem, index: number) {
    const cls = this._cls({ item, index });

    return html`
      <li class="${cls['item']}">
        <a
          data-key="${key}"
          data-index="${index}"
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
                    <div class="${cls['item-subtitle']}">
                      ${item.data.description}
                    </div>
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
