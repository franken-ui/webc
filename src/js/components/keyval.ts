import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Base } from './shared/base';
import { OptionGrouped, selectToJson } from '../helpers/select';
import { id } from '../helpers/common';

type Cls = {
  table: string;
  input: string;
  button: string;
};

type I18N = {
  'header-key': string;
  'header-value': string;
  'placeholder-key': string;
  'placeholder-value': string;
};

@customElement('uk-keyval')
export class Keyval extends Base {
  protected 'cls-default-element' = 'div';

  @property({ type: String })
  keys: string = '';

  @property({ type: String })
  values: string = '';

  @property({ type: Boolean })
  reactive: boolean = false;

  @property({ type: Boolean })
  sensitive: boolean = false;

  @property({ type: Boolean })
  noninsertable: boolean = false;

  @property({ type: Number })
  max: number = 0;

  @state()
  $cls: Cls = {
    table: '',
    input: '',
    button: '',
  };

  @state()
  $i18n: I18N = {
    'header-key': 'Key',
    'header-value': 'Value',
    'placeholder-key': 'Key',
    'placeholder-value': 'Value',
  };

  @state()
  protected valueVisibility: { [key: number]: boolean } = {};

  protected HTMLSelect: HTMLSelectElement | null = null;

  protected observer: MutationObserver | null = null;

  protected _options: OptionGrouped = {};

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
    } else {
      // Initialize with empty options if no select element is provided
      this._options = {
        __: {
          text: '__',
          options: [],
        },
      };
      // Add one empty row by default
      this.addRow();
    }

    // Initialize all rows as hidden passwords if sensitive is true
    if (this.sensitive && this._options.__ && this._options.__.options) {
      this._options.__.options.forEach((_, index) => {
        this.valueVisibility[index] = false;
      });
    }
  }

  protected createOptions() {
    if (this.reactive === false && this.isRendered === true) {
      return;
    }

    if (this.HTMLSelect) {
      this._options = selectToJson(this.HTMLSelect);

      // If no options were found, add an empty row
      if (
        !this._options.__ ||
        !this._options.__.options ||
        this._options.__.options.length === 0
      ) {
        if (!this._options.__) {
          this._options.__ = {
            text: '__',
            options: [],
          };
        }
        this.addRow();
      }
    }
  }

  protected addRow() {
    if (!this._options.__) {
      this._options.__ = {
        text: '__',
        options: [],
      };
    }

    const newIndex = this._options.__.options.length;

    this._options.__.options.push({
      group: '__',
      value: '',
      text: '',
      disabled: false,
      selected: false,
      data: { key: '' },
    });

    // Initialize visibility for new row based on sensitive setting
    if (this.sensitive) {
      this.valueVisibility[newIndex] = false;
    }

    this.requestUpdate();
  }

  protected removeRow(index: number) {
    if (
      this._options.__ &&
      this._options.__.options &&
      this._options.__.options.length > 1
    ) {
      this._options.__.options.splice(index, 1);

      // Reindex the visibility object
      const newVisibility: { [key: number]: boolean } = {};
      Object.keys(this.valueVisibility).forEach(key => {
        const numKey = parseInt(key);
        if (numKey < index) {
          newVisibility[numKey] = this.valueVisibility[numKey];
        } else if (numKey > index) {
          newVisibility[numKey - 1] = this.valueVisibility[numKey];
        }
      });
      this.valueVisibility = newVisibility;

      this.requestUpdate();
    }
  }

  protected handleKeyChange(index: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const keyValue = inputElement.value;

    if (this._options.__ && this._options.__.options[index]) {
      this._options.__.options[index].data.key = keyValue;
      this.requestUpdate();
    }
  }

  protected handleValueChange(index: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    if (this._options.__ && this._options.__.options[index]) {
      this._options.__.options[index].value = value;
      this.requestUpdate();
    }
  }

  protected setRandomValue(index: number) {
    if (this._options.__ && this._options.__.options[index]) {
      this._options.__.options[index].value = id(16);
      this.requestUpdate();
    }
  }

  protected togglePasswordVisibility(index: number) {
    if (this.sensitive) {
      this.valueVisibility[index] = !this.valueVisibility[index];
      this.requestUpdate();
    }
  }

  protected getPasswordVisibility(index: number): boolean {
    return this.valueVisibility[index] || false;
  }

  protected getInputType(index: number): string {
    if (!this.sensitive) {
      return 'text';
    }
    return this.getPasswordVisibility(index) ? 'text' : 'password';
  }

  render() {
    return html`
      <div data-host-inner class="uk-keyval">
        <table class="${this.$cls.table} uk-table">
          <thead>
            <tr>
              <th>${this.$i18n['header-key']}</th>
              <th>${this.$i18n['header-value']}</th>
              <th class="uk-table-shrink">
                ${this.noninsertable
                  ? ''
                  : html`
                      <button
                        class="${this.$cls
                          .button} uk-btn uk-btn-default uk-btn-icon"
                        type="button"
                        @click=${() => this.addRow()}
                        .disabled="${this.max > 0
                          ? this._options.__.options.length >= this.max
                          : false}"
                      >
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
                          class="lucide lucide-plus"
                        >
                          <path d="M5 12h14" />
                          <path d="M12 5v14" />
                        </svg>
                      </button>
                    `}
              </th>
            </tr>
          </thead>
          <tbody>
            ${this._options.__ && this._options.__.options
              ? this._options.__.options.map(
                  (option, index) => html`
                    <tr>
                      <td>
                        <input
                          autocomplete="off"
                          class="${this.$cls.input} uk-input"
                          placeholder="${this.$i18n['placeholder-key']}"
                          type="text"
                          value="${option.data.key || ''}"
                          @input=${(e: Event) => this.handleKeyChange(index, e)}
                        />
                      </td>
                      <td>
                        <div class="uk-keyval-value-wrapper uk-inline">
                          ${this.sensitive
                            ? html`
                                <button
                                  class="${option.value
                                    ? 'uk-disabled'
                                    : ''} uk-form-icon uk-form-icon-flip"
                                  type="button"
                                  @click=${() => this.setRandomValue(index)}
                                >
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
                                    class="lucide lucide-wand"
                                  >
                                    <path d="M15 4V2" />
                                    <path d="M15 16v-2" />
                                    <path d="M8 9h2" />
                                    <path d="M20 9h2" />
                                    <path d="M17.8 11.8 19 13" />
                                    <path d="M15 9h.01" />
                                    <path d="M17.8 6.2 19 5" />
                                    <path d="m3 21 9-9" />
                                    <path d="M12.2 6.2 11 5" />
                                  </svg>
                                </button>
                              `
                            : ''}

                          <input
                            autocomplete="off"
                            class="${this.$cls.input} uk-input"
                            placeholder="${this.$i18n['placeholder-value']}"
                            type="${this.getInputType(index)}"
                            name="${option.data.key || ''}"
                            .value="${option.value}"
                            @input=${(e: Event) =>
                              this.handleValueChange(index, e)}
                            ?disabled=${!option.data.key}
                          />
                        </div>
                      </td>
                      <td class="uk-table-shrink">
                        <div class="uk-keyval-actions">
                          ${this.sensitive
                            ? html`
                                <button
                                  class="${this.$cls
                                    .button} uk-btn uk-btn-default uk-btn-icon"
                                  type="button"
                                  @click=${() =>
                                    this.togglePasswordVisibility(index)}
                                >
                                  ${this.getPasswordVisibility(index)
                                    ? html`
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
                                          class="lucide lucide-eye-off"
                                        >
                                          <path
                                            d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
                                          />
                                          <path
                                            d="M14.084 14.158a3 3 0 0 1-4.242-4.242"
                                          />
                                          <path
                                            d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
                                          />
                                          <path d="m2 2 20 20" />
                                        </svg>
                                      `
                                    : html`
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
                                          class="lucide lucide-eye"
                                        >
                                          <path
                                            d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                                          />
                                          <circle cx="12" cy="12" r="3" />
                                        </svg>
                                      `}
                                </button>
                              `
                            : ''}
                          <button
                            class="${this.$cls
                              .button} uk-btn uk-btn-default uk-btn-icon"
                            type="button"
                            @click=${() => this.removeRow(index)}
                            ?disabled=${this._options.__.options.length <= 1}
                          >
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
                              class="lucide lucide-trash-2"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" x2="10" y1="11" y2="17" />
                              <line x1="14" x2="14" y1="11" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `,
                )
              : ''}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-keyval': Keyval;
  }
}
