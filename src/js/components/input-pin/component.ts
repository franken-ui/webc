import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('uk-input-pin')
export class InputPin extends LitElement {
  @property({ type: Boolean })
  autofocus: boolean = false;

  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: Boolean })
  error: boolean = false;

  @property({ type: Number })
  length: number = 6;

  @property({ type: String })
  name: string = '';

  @property({ type: Boolean })
  separated: boolean = false;

  @state()
  $focus: undefined | number;

  @state()
  $value: string = '';

  connectedCallback(): void {
    super.connectedCallback();

    this.removeAttribute('uk-cloak');
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('$value')) {
      if (_changedProperties.get('$value') !== this.$value) {
        this.dispatchEvent(
          new CustomEvent('uk-input-pin:input', {
            detail: { value: this.$value },
            bubbles: true,
            composed: true,
          }),
        );
      }
    }
  }

  render() {
    return html`
      <div
        class="uk-input-pin ${this.separated === true
          ? 'uk-input-pin-separated'
          : ''} ${this.disabled === true ? 'uk-disabled' : ''} ${this.error ===
        true
          ? 'uk-form-danger'
          : ''}"
      >
        ${Array(this.length)
          .fill('')
          .map(
            (_, i) =>
              html`<input
                type="text"
                maxlength="1"
                placeholder="○"
                .autofocus="${this.autofocus && i === 0 ? true : false}"
                .disabled=${this.disabled}
                @keydown="${(e: KeyboardEvent) => {
                  const inputs =
                    this.renderRoot.querySelectorAll('input[type="text"]');

                  switch (e.key) {
                    case 'Backspace':
                      const input = e.target as HTMLInputElement;

                      if (this.$focus !== undefined) {
                        if (input.value.length === 0 && this.$focus > 0) {
                          e.preventDefault();

                          const prev = inputs[
                            this.$focus - 1
                          ] as HTMLInputElement;

                          prev.focus();
                        }
                      }

                      break;
                  }
                }}"
                @input="${(e: InputEvent) => {
                  const inputs =
                    this.renderRoot.querySelectorAll('input[type="text"]');
                  let value = '';

                  inputs.forEach(a => {
                    const b = a as HTMLInputElement;

                    value += b.value;
                  });

                  const input = e.target as HTMLInputElement;

                  if (input.value.length === 1) {
                    if (i < this.length - 1) {
                      const next = inputs[i + 1] as HTMLInputElement;

                      next.focus();
                    }

                    if (i === this.length - 1) {
                      input.blur();
                    }
                  }

                  this.$value = value;
                }}"
                @focus="${() => (this.$focus = i)}"
                @blur="${() => (this.$focus = undefined)}"
              />`,
          )}
      </div>
      <input type="hidden" name="${this.name}" .value=${this.$value} />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-pin': InputPin;
  }
}
