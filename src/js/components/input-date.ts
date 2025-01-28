import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { validateDate } from '../helpers/common';
import { BaseCalendar } from './shared/base-calendar';

interface Cls extends Record<string, string> {
  button: string;
  icon: string;
  dropdown: string;
  calendar: string;
  time: string;
}

@customElement('uk-input-date')
export class InputDate extends BaseCalendar {
  protected 'cls-default-element' = 'button';

  protected 'input-event' = 'uk-input-date:input';

  @property({ type: Boolean })
  'with-time': boolean = false;

  @property({ type: Boolean })
  'require-time': boolean = false;

  @property({ type: String })
  drop: string = 'mode: click';

  @property({ type: String })
  icon: string = '';

  @state()
  private $date: string | undefined;

  @state()
  private $time: string | undefined;

  @state()
  private $d: string | undefined;

  @state()
  private $t: string | undefined;

  @state()
  protected $cls: Cls = {
    button: '',
    icon: '',
    dropdown: 'uk-datepicker-dropdown',
    calendar: '',
    time: '',
  };

  private _icon: boolean | string = false;

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

  protected get $value(): string {
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

    if (this['with-time'] === true) {
      text += ' and time';
    }

    return text;
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.hasAttribute('icon')) {
      const icon = this.getAttribute('icon');

      if (icon === '') {
        this._icon = true;
      } else {
        this._icon = icon as string;
      }
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.renderRoot
      .querySelector('uk-calendar')
      ?.addEventListener('uk-calendar:change', (e: any) => {
        this.$d = e.detail.value;
      });

    if (this['with-time'] === true) {
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
          <button
            class="${this.$cls['button']}"
            type="button"
            .disabled=${this.disabled}
          >
            ${this.$text}
            ${this._icon === true
              ? html`
                  <span class="${this.$cls['icon']}" data-uk-calendar></span>
                `
              : this.icon !== ''
                ? html`
                    <uk-icon
                      class="${this.$cls['icon']}"
                      icon="${this.icon}"
                    ></uk-icon>
                  `
                : ''}
          </button>
          <div
            class="uk-drop ${this.$cls['dropdown']}"
            data-uk-dropdown="${this.drop}"
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

            ${this['with-time']
              ? html`
                  <div class="uk-datepicker-time">
                    <uk-input-time
                      now
                      .required=${this['require-time']}
                      .i18n="${JSON.stringify(this.$i18n)}"
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
