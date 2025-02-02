import { html, PropertyValues } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { Input } from './shared/input';

@customElement('uk-input-range')
export class InputRange extends Input {
  protected readonly 'cls-default-element' = 'div';

  protected readonly 'input-event' = 'uk-input-range:input';

  @property({ type: Boolean })
  multiple = false;

  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: Number })
  step = 1;

  @property({ type: String })
  label: string | boolean = false;

  @property({ type: String })
  'label-position': 'top' | 'bottom' = 'top';

  private activeKnobElement: HTMLElement | null = null;

  private _lowValue = this.min;

  private _highValue = this.max;

  private _label: boolean | string = false;

  private focused: 'low' | 'high' | null = null;

  protected get $text(): string {
    return '';
  }

  protected get $value(): string | string[] {
    return this.multiple
      ? this.value.split(',').map(a => a.trim())
      : this.value;
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    const label = this.getAttribute('label');
    this._label = label === '' ? true : label || false;
  }

  protected initializeValue(): void {
    if (!this.value) {
      this._lowValue = this.min;
      this._highValue = this.max;
      this.value = this.multiple
        ? `${this.formatValue(this._lowValue)},${this.formatValue(this._highValue)}`
        : this.formatValue(this._lowValue);
    } else {
      this.parseValue();
    }
  }

  private formatValue(value: number): string {
    const fixed = value.toFixed(2);
    return fixed.endsWith('.00') ? fixed.slice(0, -3) : fixed;
  }

  private parseValue() {
    if (this.multiple) {
      const [low, high] = this.value.split(',').map(val => parseFloat(val));
      if (low !== undefined && high !== undefined) {
        this._lowValue = this.clamp(low);
        this._highValue = this.clamp(high);
      }
    } else {
      this._lowValue = this.clamp(parseFloat(this.value));
    }
  }

  private clamp(val: number): number {
    return parseFloat(Math.min(Math.max(val, this.min), this.max).toFixed(2));
  }

  private valueToPercent(val: number): number {
    return ((val - this.min) / (this.max - this.min)) * 100;
  }

  private updateValue() {
    this.value = this.multiple
      ? `${this.formatValue(this._lowValue)},${this.formatValue(this._highValue)}`
      : this.formatValue(this._lowValue);
    this.emit();
  }

  private handleValueChange(knob: 'low' | 'high', newValue: number) {
    newValue = this.clamp(Math.round(newValue / this.step) * this.step);

    if (knob === 'low') {
      this._lowValue = this.multiple
        ? Math.min(newValue, this._highValue)
        : newValue;
    } else {
      this._highValue = Math.max(newValue, this._lowValue);
    }

    this.updateValue();
    this.requestUpdate();
  }

  private onPointerDown(e: PointerEvent, knob: 'low' | 'high') {
    if (this.disabled) return;
    e.preventDefault();
    this.activeKnobElement = e.currentTarget as HTMLElement;
    this.focused = knob;
    this.activeKnobElement.setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).focus();
    this.addEventListener('pointermove', this.onPointerMove);
    this.addEventListener('pointerup', this.onPointerUp);
    this.addEventListener('pointercancel', this.onPointerUp);
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.disabled || !this.focused) return;
    const rect = this.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newValue = this.min + percent * (this.max - this.min);
    this.handleValueChange(this.focused, newValue);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.activeKnobElement) {
      this.activeKnobElement.releasePointerCapture(e.pointerId);
      this.activeKnobElement = null;
    }
    this.focused = null;
    this.removeEventListener('pointermove', this.onPointerMove);
    this.removeEventListener('pointerup', this.onPointerUp);
    this.removeEventListener('pointercancel', this.onPointerUp);
  };

  private onKeyDown(e: KeyboardEvent, knob: 'low' | 'high') {
    if (this.disabled) return;
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowUp'
        ? this.step
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
          ? -this.step
          : 0;

    if (delta) {
      e.preventDefault();
      const currentValue = knob === 'low' ? this._lowValue : this._highValue;
      this.handleValueChange(knob, currentValue + delta);
    }
  }

  render() {
    const lowPercent = this.valueToPercent(this._lowValue);
    const highPercent = this.multiple
      ? this.valueToPercent(this._highValue)
      : lowPercent;
    const rangeStyle = `left: ${this.multiple ? lowPercent : 0}%; width: ${this.multiple ? highPercent - lowPercent : lowPercent}%`;

    const renderKnob = (type: 'low' | 'high') => {
      const value = type === 'low' ? this._lowValue : this._highValue;
      const percent = type === 'low' ? lowPercent : highPercent;
      const min = type === 'low' ? this.min : this._lowValue;
      const max =
        type === 'low'
          ? this.multiple
            ? this._highValue
            : this.max
          : this.max;

      return html`
        <button
          type="button"
          class="uk-input-range-knob ${type}"
          role="slider"
          aria-valuemin="${min}"
          aria-valuemax="${max}"
          aria-valuenow="${value}"
          ?disabled=${this.disabled}
          style="left: ${percent}%"
          @pointerdown=${(e: PointerEvent) => this.onPointerDown(e, type)}
          @keydown=${(e: KeyboardEvent) => this.onKeyDown(e, type)}
        >
          ${this._label
            ? html`
                <span class="uk-input-range-label ${this['label-position']}">
                  ${type === 'low' ? this.formatValue(value) : ''}
                  ${typeof this.label === 'string' ? this.label : ''}
                  ${type === 'high' ? this.formatValue(value) : ''}
                </span>
              `
            : ''}
        </button>
      `;
    };

    return html`
      <div class="uk-input-range">
        <div class="uk-input-range-runnable-track"></div>
        <div class="uk-input-range-track" style="${rangeStyle}"></div>
        ${renderKnob('low')} ${this.multiple ? renderKnob('high') : ''}
        ${this.renderHidden()}
      </div>
    `;
  }

  protected updated(changedProps: PropertyValues) {
    if (changedProps.has('value') || changedProps.has('multiple')) {
      this.parseValue();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-range': InputRange;
  }
}
