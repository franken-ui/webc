import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseOptions, validateDate } from '../helpers/common';
import { BaseCalendar } from './shared/base-calendar';

interface I18N {
  weekdays: string;
  months: string;
  am: string;
  pm: string;
}

interface CalendarI18N {
  weekdays: string;
  months: string;
}

interface TimeI18N {
  am: string;
  pm: string;
}

@customElement('uk-input-date')
export class InputDate extends BaseCalendar {
  @property({ type: Boolean })
  time: boolean = false;

  @property({ type: String })
  placeholder: string = '';

  @state()
  private $timeI18n: Partial<TimeI18N> = {};

  @state()
  private $date: string | undefined;

  @state()
  private $time: string | undefined;

  @state()
  private $d: string | undefined;

  @state()
  private $t: string | undefined;

  protected initializeValue(): void {
    if (this.value) {
      try {
        const date = validateDate(this.value);
        const hours = date.getHours();
        const minutes = date.getMinutes();

        this.$date = date.toISOString().slice(0, 10);
        this.$time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error(error);
      }
    }
  }

  protected getHiddenValue(): string {
    return this.$value;
  }

  get $value(): string {
    if (this.$d && this.$t) {
      return `${this.$d}T${this.$t}`;
    }

    if (this.$d) {
      return this.$d;
    }

    return '';
  }

  get $text(): string {
    if (this.$value !== '') {
      return 'TODO';
    }

    if (this.placeholder) {
      return this.placeholder;
    }

    let text = 'Select a date';

    if (this.time === true) {
      text += ' and time';
    }

    return text;
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.value) {
      try {
        const date = validateDate(this.value);
        const hours = date.getHours();
        const minutes = date.getMinutes();

        this.$date = date.toISOString().slice(0, 10);
        this.$time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error(error);
      }
    }
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.renderRoot
      .querySelector('uk-calendar')
      ?.addEventListener('uk-calendar:change', (e: any) => {
        this.$d = e.detail.value;
      });

    if (this.time === true) {
      this.renderRoot
        .querySelector('uk-input-time')
        ?.addEventListener('uk-input-time:input', (e: any) => {
          this.$t = e.detail.value;
        });
    }
  }

  render() {
    return html`
      <div class="uk-datepicker">
        <div class="uk-position-relative">
          <button class="uk-input-fake">${this.$text}</button>
          <div
            class="uk-drop uk-datepicker-dropdown"
            data-uk-dropdown="mode: click"
          >
            <uk-calendar
              .starts-with="${this['starts-with']}"
              .disabled-dates="${this['disabled-dates']}"
              .marked-dates="${this['marked-dates']}"
              .i18n="${JSON.stringify(this.$i18n)}"
              .view-date="${this['view-date']}"
              .min="${this['min']}"
              .max="${this['max']}"
              .value="${this.$date as string}"
              .today="${this.today}"
              .jumpable="${this.jumpable}"
            ></uk-calendar>

            ${this.time
              ? html`
                  <div class="uk-datepicker-time">
                    <uk-input-time
                      now
                      required
                      .i18n="${JSON.stringify(this.$timeI18n)}"
                      .value="${this.$time as string}"
                    ></uk-input-time>
                  </div>
                `
              : ''}
          </div>
        </div>

        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-date': InputDate;
  }
}
