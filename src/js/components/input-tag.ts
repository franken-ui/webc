import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseOptions } from '../helpers/common';
import slugify from 'slugify';
import { Input } from './shared/input';

type SlugOptions = {
  replacement: string;
  remove: undefined | RegExp;
  lower: boolean;
  strict: boolean;
  locale: string;
  trim: boolean;
};

type Cls = {
  div: string;
};

@customElement('uk-input-tag')
export class InputTag extends Input {
  protected 'cls-default-element' = 'div';

  protected 'input-event' = 'uk-input-tag:input';

  @property({ type: Number })
  maxlength: number = 20;

  @property({ type: Number })
  minlength: number = 1;

  @property({ type: Boolean })
  slugify: boolean = false;

  @property({ type: String })
  'slugify-options': string = '';

  @property({ type: String })
  state: 'primary' | 'secondary' | 'destructive' = 'secondary';

  @state()
  $cls: Cls = {
    div: '',
  };

  @state()
  $input: string = '';

  @state()
  $slugOptions: Partial<SlugOptions> = {
    lower: true,
    strict: true,
  };

  @state()
  $tags: string[] = [];

  get $value(): string[] {
    return this.$tags;
  }

  get $text(): string {
    return '';
  }

  protected initializeValue() {
    this.$tags = this.value === '' ? [] : this.value.split(',');

    if (this['slugify-options']) {
      const options = parseOptions(this['slugify-options']) as {
        [key: string]: string;
      };

      if ('replacement' in options) {
        this.$slugOptions['replacement'] = options['replacement'];
      }

      if ('remove' in options) {
        this.$slugOptions['remove'] = new RegExp(options.remove, 'g');
      }

      if ('lower' in options) {
        this.$slugOptions['lower'] = options.lower === 'true' ? true : false;
      }

      if ('strict' in options) {
        this.$slugOptions['strict'] = options.strict === 'true' ? true : false;
      }

      if ('locale' in options) {
        this.$slugOptions['locale'] = options['locale'];
      }

      if ('trim' in options) {
        this.$slugOptions['trim'] = options.trim === 'true' ? true : false;
      }
    }
  }

  private push() {
    let tag = this.$input;

    if (this.slugify) {
      tag = slugify(this.$input, this.$slugOptions);
    }

    if (this.$input.length >= this.minlength && !this.$tags.includes(tag)) {
      this.$tags.push(tag);
      this.$input = '';
    }

    this.emit();
  }

  render() {
    return html`
      <div
        class="uk-input-tag ${this.disabled === true
          ? 'uk-disabled'
          : ''} ${this.$cls['div']}"
      >
        ${this.$tags.map(
          (tag, i) => html`
            <div class="uk-tag ${`uk-tag-${this.state}`}">
              <span
                @click=${() => {
                  if (this.disabled === false) {
                    this.$input = this.$tags[i];
                    this.$tags = this.$tags.filter((_, b) => b !== i);

                    this.renderRoot.querySelector('input')?.focus();
                  }
                }}
              >
                ${tag}
              </span>
              <a
                @click="${() => {
                  if (this.disabled === false) {
                    this.$tags = this.$tags.filter((_, b) => b !== i);
                  }
                }}"
                uk-close
              ></a>
            </div>
          `,
        )}

        <input
          .disabled=${this.disabled}
          autocomplete="off"
          type="text"
          placeholder="${this.placeholder}"
          @keydown=${(e: KeyboardEvent) => {
            switch (e.key) {
              case 'Backspace':
                if (this.$tags.length > 0 && this.$input.length === 0) {
                  e.preventDefault();

                  this.$input = this.$tags.slice(-1)[0];
                  this.$tags.pop();
                }
                break;

              case ',':
                e.preventDefault();
                this.push();
                break;

              case 'Enter':
                e.preventDefault();
                this.push();
                break;
            }
          }}
          @input=${(e: InputEvent) => {
            const input = e.target as HTMLInputElement;

            this.$input = input.value;
          }}
          .maxLength=${this.maxlength}
          .value=${this.$input}
        />
        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-tag': InputTag;
  }
}
