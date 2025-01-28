import { PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Input } from './shared/input';

type Cls = {
  div: string;
};

@customElement('uk-input-pin')
export class InputPin extends Input {
  protected 'cls-default-element' = 'div';

  protected 'input-event' = 'uk-input-pin:input';

  @property({ type: Boolean })
  autofocus: boolean = false;

  @property({ type: Number })
  length: number = 6;

  @state()
  $cls: Cls = {
    div: '',
  };

  @state()
  $focus: undefined | number;

  @state()
  $v: string = '';

  get $value(): string {
    return this.$v;
  }

  get $text(): string {
    return '';
  }

  private HTMLInputs: NodeList | undefined;

  protected initializeValue(): void {}

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.HTMLInputs = this.renderRoot.querySelectorAll('input[type="text"]');

    this.HTMLInputs.forEach(a => {
      a.addEventListener('paste', (e: Event) => {
        e.preventDefault();
        const clipboardData = (e as ClipboardEvent).clipboardData;

        if (clipboardData) {
          const text = clipboardData.getData('Text').substring(0, this.length);

          this.$v = text;

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

          let value = '';
          this.HTMLInputs?.forEach(a => {
            value += (a as HTMLInputElement).value;
          });
          this.$v = value;

          this.emit();
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
      ${this.renderHidden()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-pin': InputPin;
  }
}
