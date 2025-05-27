import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseOptions } from '../helpers/common';
import slugify from 'slugify';
import { Input } from './shared/input';

type SlugOptions = {
  replacement: string;
  remove: undefined | RegExp;
  lower: boolean;
  strict: boolean;
  locale: string;
  trim: boolean;
};

type Cls = {
  div: string;
};

/**
 * A tag input component that allows users to add, edit, and remove tags.
 *
 * @element uk-input-tag
 * @extends {Input}
 *
 * Features:
 * - Tag creation via comma/enter key
 * - Optional slug transformation
 * - Click-to-edit functionality
 * - Length validation
 * - Multiple visual states
 * - Form integration
 *
 * @fires uk-input-tag:input - Emitted when tags are added or removed
 *
 * @example
 * ```html
 * <uk-input-tag
 *   name="tags"
 *   placeholder="Add tags..."
 *   slugify
 *   minlength="2"
 *   maxlength="15"
 *   state="primary">
 * </uk-input-tag>
 * ```
 */
@customElement('uk-input-tag')
export class InputTag extends Input {
  /**
   * The default element key used for applying simple string CSS classes via `cls-custom`.
   * For this component, it targets the div element.
   */
  protected 'cls-default-element' = 'div';

  /**
   * Custom event name emitted when the value changes.
   * Used for dispatching input events from this component.
   */
  protected 'input-event' = 'uk-input-tag:input';

  /**
   * Maximum character length allowed for each tag.
   * Tags exceeding this length will be truncated or rejected.
   *
   * @default 20
   * @example
   * ```html
   * <uk-input-tag maxlength="10"></uk-input-tag>
   * ```
   */
  @property({ type: Number })
  maxlength: number = 20;

  /**
   * Minimum character length required for each tag.
   * Tags shorter than this length will not be added.
   *
   * @default 1
   * @example
   * ```html
   * <uk-input-tag minlength="3"></uk-input-tag>
   * ```
   */
  @property({ type: Number })
  minlength: number = 1;

  /**
   * Enables slug transformation for tags, converting them to a URL-friendly format.
   * When enabled, tags are automatically slugified on entry.
   *
   * @default false
   * @example
   * ```html
   * <uk-input-tag slugify></uk-input-tag>
   * ```
   */
  @property({ type: Boolean })
  slugify: boolean = false;

  /**
   * Slugify configuration options as a JSON string.
   * Allows customization of slugification behavior (e.g., replacement character, case, strictness).
   *
   * @example
   * ```html
   * <uk-input-tag slugify slugify-options='{"lower": true, "replacement": "-", "strict": true}'></uk-input-tag>
   * ```
   */
  @property({ type: String })
  'slugify-options': string = '';

  /**
   * Visual state or theme for tag appearance.
   * Determines the color and style of tags (e.g., primary, secondary, destructive).
   *
   * @default 'secondary'
   * @example
   * ```html
   * <uk-input-tag state="primary"></uk-input-tag>
   * ```
   */
  @property({ type: String })
  state: 'primary' | 'secondary' | 'destructive' = 'secondary';

  /**
   * CSS class configuration for component styling.
   * Allows customization of different component parts via the $cls object.
   * @internal
   */
  @state()
  $cls: Cls = {
    div: '',
  };

  /**
   * Current value of the input field being typed by the user.
   * Used for creating new tags.
   * @internal
   */
  @state()
  $input: string = '';

  /**
   * Parsed slugify options with defaults, used for tag transformation.
   * @internal
   */
  @state()
  $slugOptions: Partial<SlugOptions> = {
    lower: true,
    strict: true,
  };

  /**
   * Array of tags currently created by the user.
   * @internal
   */
  @state()
  $tags: string[] = [];

  /**
   * Returns the array of tags for form submission and events.
   *
   * @returns Array of tag strings
   */
  get $value(): string[] {
    return this.$tags;
  }

  /**
   * Returns a display text representation (not used for tag inputs).
   *
   * @returns An empty string
   */
  get $text(): string {
    return '';
  }

  /**
   * Initializes the component value from a comma-separated string and parses slug options.
   * Called on component initialization.
   */
  protected initializeValue(): void {
    this.initializeTags();
    this.initializeSlugOptions();
  }

  /**
   * Parses initial tags from the value property and populates the tag array.
   * @internal
   */
  private initializeTags(): void {
    this.$tags = this.value === '' ? [] : this.value.split(',');
  }

  /**
   * Parses and applies slugify options from the slugify-options property.
   * @internal
   */
  private initializeSlugOptions(): void {
    if (!this['slugify-options']) return;

    const options = parseOptions(this['slugify-options']) as Record<
      string,
      string
    >;

    if (options.replacement) {
      this.$slugOptions.replacement = options.replacement;
    }

    if (options.remove) {
      this.$slugOptions.remove = new RegExp(options.remove, 'g');
    }

    if (options.lower) {
      this.$slugOptions.lower = options.lower === 'true';
    }

    if (options.strict) {
      this.$slugOptions.strict = options.strict === 'true';
    }

    if (options.locale) {
      this.$slugOptions.locale = options.locale;
    }

    if (options.trim) {
      this.$slugOptions.trim = options.trim === 'true';
    }
  }

  /**
   * Adds the current input as a new tag if it is valid and not a duplicate.
   * Applies slug transformation if enabled.
   * Emits an input event on success.
   * @internal
   */
  private addTag(): void {
    if (!this.$input.trim()) {
      return;
    }

    let tag = this.$input.trim();

    if (this.slugify) {
      tag = slugify(tag, this.$slugOptions);
    }

    if (tag.length >= this.minlength && !this.$tags.includes(tag)) {
      this.$tags = [...this.$tags, tag];
      this.$input = '';
      this.emit();
    }
  }

  /**
   * Removes the tag at the specified index.
   * Emits an input event after removal.
   *
   * @param index Index of the tag to remove
   * @internal
   */
  private removeTag(index: number): void {
    if (this.disabled) return;

    this.$tags = this.$tags.filter((_, i) => i !== index);
    this.emit();
  }

  /**
   * Moves the tag at the specified index back to the input field for editing.
   * Focuses the input after state update.
   *
   * @param index Index of the tag to edit
   * @internal
   */
  private editTag(index: number): void {
    if (this.disabled) return;

    this.$input = this.$tags[index];
    this.removeTag(index);

    // Focus input after state update
    this.updateComplete.then(() => {
      this.renderRoot.querySelector('input')?.focus();
    });
  }

  /**
   * Handles keyboard interactions for tag management (add, edit, remove).
   * Supports Backspace, comma, and Enter keys.
   *
   * @param e Keyboard event
   * @internal
   */
  private handleKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Backspace':
        if (this.$tags.length > 0 && this.$input.length === 0) {
          e.preventDefault();
          this.editTag(this.$tags.length - 1);
        }
        break;

      case ',':
      case 'Enter':
        e.preventDefault();
        this.addTag();
        break;
    }
  }

  /**
   * Handles input field changes and updates the current input value.
   *
   * @param e Input event
   * @internal
   */
  private handleInput(e: InputEvent): void {
    const input = e.target as HTMLInputElement;
    this.$input = input.value;
  }

  /**
   * Renders a single tag element with edit and remove functionality.
   *
   * @param tag Tag text
   * @param index Tag index
   * @returns Template for the tag element
   * @internal
   */
  private renderTag(tag: string, index: number) {
    return html`
      <div class="uk-tag-${this.state} uk-tag">
        <span @click="${() => this.editTag(index)}"> ${tag} </span>
        <a @click="${() => this.removeTag(index)}" uk-close></a>
      </div>
    `;
  }

  /**
   * Renders the complete tag input component, including tags, input field, and hidden input for form integration.
   *
   * @returns Template for the component
   */
  render() {
    return html`
      <div
        data-host-inner
        class="${this.disabled ? 'uk-disabled' : ''} ${this.$cls.div ||
        ''} uk-input-tag"
      >
        ${this.$tags.map((tag, index) => this.renderTag(tag, index))}

        <input
          .disabled="${this.disabled}"
          autocomplete="off"
          type="text"
          placeholder="${this.placeholder}"
          .maxLength="${this.maxlength}"
          .value="${this.$input}"
          @keydown="${this.handleKeydown}"
          @input="${this.handleInput}"
        />
        ${this.renderHidden()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-input-tag': InputTag;
  }
}
