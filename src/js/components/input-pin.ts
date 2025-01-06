import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseOptions } from '../helpers/common';

type Cls = {
  div: string;
};

@customElement('uk-input-pin')
export class InputPin extends LitElement {
  @property({ type: Boolean })
  autofocus: boolean = false;

  @property({ type: String })
  'cls-custom': string = '';

  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: Number })
  length: number = 6;

  @property({ type: String })
  name: string = '';

  @state()
  $cls: Cls = {
    div: '',
  };

  @state()
  $focus: undefined | number;

  @state()
  $values: string[] = [];

  @state()
  $value: string = '';

  private HTMLInputs: NodeList | undefined;

  connectedCallback(): void {
    super.connectedCallback();

    if (this['cls-custom']) {
      const cls = parseOptions(this['cls-custom']) as Cls | string;

      if (typeof cls === 'string') {
        this.$cls['div'] = cls;
      } else {
        Object.keys(this.$cls).forEach(a => {
          const key = a as 'div';

          if (cls[key]) {
            this.$cls[key] = cls[key];
          }
        });
      }
    }

    Array(this.length)
      .fill('')
      .map((_, b) => {
        this.$values[b] = '';
      });
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.HTMLInputs = this.renderRoot.querySelectorAll('input[type="text"]');

    this.HTMLInputs.forEach(a => {
      a.addEventListener('paste', (e: Event) => {
        e.preventDefault();
        const clipboardData = (e as ClipboardEvent).clipboardData;

        if (clipboardData) {
          const text = clipboardData.getData('Text').substring(0, this.length);

          text.split('').forEach((str, i) => {
            const input = (this.HTMLInputs as NodeList)[i] as HTMLInputElement;

            input.disabled = false;
            input.value = str;
          });

          if (text.length < this.length) {
            const next = (this.HTMLInputs as NodeList)[
              text.length
            ] as HTMLInputElement;

            next.disabled = false;
            next.focus();
          } else {
            (
              (this.HTMLInputs as NodeList)[
                this.$focus as number
              ] as HTMLInputElement
            ).blur();
          }
        }
      });
    });
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private renderInput(i: number) {
    return html`
      <input
        type="text"
        maxlength="1"
        placeholder="○"
        .autofocus="${this.autofocus && i === 0 ? true : false}"
        .disabled="${i === 0 ? false : true}"
        @keydown="${(e: KeyboardEvent) => {
          const input = e.target as HTMLInputElement;

          switch (e.key) {
            case 'Backspace':
              if (this.$focus !== undefined) {
                if (input.value.length === 0 && this.$focus > 0) {
                  e.preventDefault();

                  const prev = (this.HTMLInputs as NodeList)[
                    this.$focus - 1
                  ] as HTMLInputElement;

                  prev.focus();
                  input.disabled = true;
                }
              }
              break;

            case 'Delete':
              if (this.$focus !== undefined) {
                if (input.value.length === 0) {
                  e.preventDefault();

                  const next = (this.HTMLInputs as NodeList)[
                    this.$focus + 1
                  ] as HTMLInputElement;

                  if (next) {
                    next.focus();
                    next.setSelectionRange(0, 0);
                  }
                }
              }
              break;
          }
        }}"
        @input="${(e: InputEvent) => {
          const input = e.target as HTMLInputElement;

          if (input.value.length === 1) {
            if (i < this.length - 1) {
              const next = (this.HTMLInputs as NodeList)[
                i + 1
              ] as HTMLInputElement;

              next.disabled = false;
              next.focus();
            }

            if (i === this.length - 1) {
              input.blur();
            }
          }

          this.$values[i] = input.value;
          this.$value = this.$values.join('');

          this.dispatchEvent(
            new CustomEvent('uk-input-pin:input', {
              detail: { value: this.$value },
              bubbles: true,
              composed: true,
            }),
          );
        }}"
        @focus="${() => (this.$focus = i)}"
        @blur="${() => (this.$focus = undefined)}"
      />
    `;
  }

  render() {
    return html`
      <div
        class="uk-input-pin ${this.disabled === true
          ? 'uk-disabled'
          : ''} ${this.$cls['div']}"
      >
        ${Array(this.length)
          .fill('')
          .map((_, i) => this.renderInput(i))}
      </div>
      ${this.name
        ? html`
            <input type="hidden" name="${this.name}" .value="${this.$value}" />
          `
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-pin': InputPin;
  }
}
