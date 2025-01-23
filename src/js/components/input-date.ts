import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('uk-input-date')
export class InputDate extends LitElement {
  @property({ type: Boolean }) jumpable = false;

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.renderRoot
      .querySelector('uk-calendar')
      ?.addEventListener('uk-calendar:change', (e: any) => {
        console.log(e.detail.value);
      });
  }

  render() {
    return html`
      <div class="uk-datepicker">
        <div class="uk-inline">
          <button class="uk-input-fake">Select a date</button>
          <div class="uk-drop uk-datepicker-cal" data-uk-dropdown="mode: click">
            <uk-calendar .jumpable="${this.jumpable}"></uk-calendar>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-date': InputDate;
  }
}
