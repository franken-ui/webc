import { PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { validateTime } from '../helpers/common';
import { Input } from './shared/input';

type I18N = {
  am: string;
  pm: string;
};

type Cls = {
  input: string;
};

@customElement('uk-input-time')
export class InputTime extends Input {
  protected 'cls-default-element' = 'input';

  protected 'input-event' = 'uk-input-time:input';

  @property({ type: Boolean })
  now: boolean = false;

  @property({ type: String })
  min: string = '';

  @property({ type: String })
  max: string = '';

  @state()
  $i18n: I18N = {
    am: 'am',
    pm: 'pm',
  };

  @state()
  $cls: Cls = {
    input: '',
  };

  @state()
  $hour: number | undefined;

  @state()
  $min: number = 0;

  @state()
  $meridiem: 'am' | 'pm' = 'am';

  protected initializeValue() {
    if (this.value) {
      try {
        const validatedTime = validateTime(this.value);
        const [hours, minutes] = validatedTime.split(':').map(Number);

        this.$hour = hours % 12 || 12;
        this.$min = minutes;
        this.$meridiem = hours < 12 ? 'am' : 'pm';
      } catch (error) {
        console.error(error);
      }
    } else if (this.now === true) {
      const date = new Date();

      this.$hour = date.getHours() % 12 || 12;
      this.$min = date.getMinutes();
      this.$meridiem = date.getHours() < 12 ? 'am' : 'pm';
    }
  }

  get $HH(): string {
    if (this.$hour) {
      return this.$hour.toString().padStart(2, '0');
    }

    return '00';
  }

  get $MM(): string {
    if (this.$min >= 0) {
      return this.$min.toString().padStart(2, '0');
    }

    return '00';
  }

  get $value(): string {
    let value = '';

    if (this.$hour) {
      let hour = this.$hour;

      if (this.$meridiem === 'pm') {
        hour = this.$hour === 12 ? 12 : this.$hour + 12;
      } else {
        hour = this.$hour === 12 ? 0 : this.$hour;
      }

      value = `${hour.toString().padStart(2, '0')}:${this.$min.toString().padStart(2, '0')}`;
    }

    return value;
  }

  get $text(): string {
    return '';
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (
      _changedProperties.has('$hour') ||
      _changedProperties.has('$min') ||
      _changedProperties.has('$meridiem')
    ) {
      this.emit();
    }
  }

  private renderInput(options: {
    min: number;
    max: number;
    state: '$hour' | '$min';
    key: '$HH' | '$MM';
  }) {
    const { min, max, state, key } = options;

    let value;

    switch (state) {
      case '$hour':
        value =
          this.$hour !== undefined
            ? this.$hour.toString().padStart(2, '0')
            : '';
        break;
      case '$min':
        value =
          this.$hour === undefined
            ? '00'
            : this.$min > 0
              ? this.$min.toString().padStart(2, '0')
              : '00';
        break;
    }

    return html`
      <input
        data-key="${key}"
        class="uk-input ${this.$cls['input']}"
        type="number"
        min="${min}"
        max="${max}"
        step="1"
        placeholder="${state === '$hour' ? '09' : '00'}"
        maxlength="2"
        value="${value as string}"
        .disabled="${this.disabled ||
        (state !== '$hour' && this.$hour === undefined)}"
        @keydown="${(e: KeyboardEvent) => {
          switch (state) {
            case '$min':
              switch (e.key) {
                case 'ArrowDown':
                  if (this.$min === 0) {
                    e.preventDefault();
                  }
                  break;
              }
          }
        }}"
        @input="${(e: KeyboardEvent) => {
          const input = e.target as HTMLInputElement;

          const v = input.value.replace(/[^0-9]/g, '').substring(0, 2);
          const vn = parseInt(v);

          switch (state) {
            case '$hour':
              if (vn <= 12) {
                this.$hour = vn;
              }
              break;

            case '$min':
              if (vn <= 59) {
                this.$min = vn;
              }
              break;
          }
          input.value = v;
        }}"
        @blur="${(e: KeyboardEvent) => {
          const input = e.target as HTMLInputElement;

          const vn = parseInt(input.value);

          switch (state) {
            case '$hour':
              if (input.value === '') {
                if (this.required === false) {
                  this.$hour = undefined;
                } else {
                  input.value = this.$HH;
                }
                return;
              }

              if (vn > 12) {
                this.$hour = 12;
                input.value = '12';
              } else {
                input.value = this.$HH as string;
              }

              break;

            case '$min':
              if (vn > 59) {
                this.$min = 59;
              }

              input.value = this.$MM as string;

              break;
          }
        }}"
      />
    `;
  }

  render() {
    return html`
      <div class="uk-input-time">
        ${this.renderInput({
          min: 1,
          max: 12,
          state: '$hour',
          key: '$HH',
        })}
        <span>&colon;</span>
        ${this.renderInput({
          min: 0,
          max: 59,
          state: '$min',
          key: '$MM',
        })}
        <button
          data-key="meridiem"
          class="uk-input-fake ${this.$cls['input']}"
          @click="${(e: MouseEvent) => {
            e.preventDefault();

            this.$meridiem = this.$meridiem === 'am' ? 'pm' : 'am';
          }}"
          @keydown="${(e: KeyboardEvent) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();

              this.$meridiem = this.$meridiem === 'am' ? 'pm' : 'am';
            }
          }}"
          type="button"
          .disabled="${this.disabled || this.$hour === undefined}"
        >
          ${this.$locales[this.$meridiem]}
        </button>
        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-time': InputTime;
  }
}
