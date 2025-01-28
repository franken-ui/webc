import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { Base } from './base';

export abstract class Input extends Base {
  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: String })
  name: string = '';

  @property({ type: String })
  placeholder: string = '';

  @property({ type: Boolean })
  required: boolean = false;

  @property({ type: String })
  value: string = '';

  protected renderHidden() {
    return typeof this.$value === 'string'
      ? html`
          <input name="${this.name}" type="hidden" value="${this.$value}" />
        `
      : (this.$value as string[]).map(
          a => html`<input name="${this.name}[]" type="hidden" value="${a}" />`,
        );
  }

  protected emit() {
    this.dispatchEvent(
      new CustomEvent(this['input-event'], {
        detail: {
          value: this.$value,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.initializeValue();
  }

  protected abstract get $value(): string | string[];

  protected abstract get $text(): string;

  protected abstract 'input-event': string;

  protected abstract initializeValue(): void;
}
