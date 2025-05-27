import { type PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Input } from './shared/input';

/**
 * Internationalization strings for the rich text editor.
 * Allows customizing UI text for localization.
 *
 * @example
 * ```typescript
 * const i18n = {
 *   'link-insert': 'Insert Link',
 *   'link-save': 'Save',
 *   'link-remove': 'Remove',
 *   'link-form-label': 'URL',
 *   'link-placeholder': 'https://example.com',
 *   'word-counter-singular': 'word',
 *   'word-counter-plural': 'words',
 * };
 * ```
 */
type I18N = {
  /** Text for inserting a new link */
  'link-insert': string;
  /** Text for saving a link */
  'link-save': string;
  /** Text for removing a link */
  'link-remove': string;
  /** Label for the link URL form field */
  'link-form-label': string;
  /** Placeholder text for the link URL input */
  'link-placeholder': string;
  /** Singular form of word counter text */
  'word-counter-singular': string;
  /** Plural form of word counter text */
  'word-counter-plural': string;
  /** Tooltip for bold button */
  'tooltip-bold': string;
  /** Tooltip for italic button */
  'tooltip-italic': string;
  /** Tooltip for underline button */
  'tooltip-underline': string;
  /** Tooltip for strikethrough button */
  'tooltip-strikethrough': string;
  /** Tooltip for bullet list button */
  'tooltip-list': string;
  /** Tooltip for ordered list button */
  'tooltip-list-ordered': string;
  /** Tooltip for heading button, with {level} placeholder */
  'tooltip-h1': string;
  /** Tooltip for heading button, with {level} placeholder */
  'tooltip-h2': string;
  /** Tooltip for heading button, with {level} placeholder */
  'tooltip-h3': string;
  /** Tooltip for heading button, with {level} placeholder */
  'tooltip-h4': string;
  /** Tooltip for align button, with {alignment} placeholder */
  'tooltip-align-left': string;
  /** Tooltip for align button, with {alignment} placeholder */
  'tooltip-align-center': string;
  /** Tooltip for align button, with {alignment} placeholder */
  'tooltip-align-right': string;
  /** Tooltip for align button, with {alignment} placeholder */
  'tooltip-align-justify': string;
  /** Tooltip for blockquote button */
  'tooltip-blockquote': string;
};

/**
 * CSS class names for customizing RTE elements.
 * Can be used with the `cls-custom` property for styling.
 *
 * @example
 * ```html
 * <uk-rte cls-custom='{"editor": "my-editor-class"}'></uk-rte>
 * ```
 */
type Cls = {
  /** CSS class for the editor container */
  editor: string;
};

/**
 * Rich Text Editor web component based on TipTap, providing formatting tools and form integration.
 *
 * Features:
 * - Text formatting (bold, italic, underline, strikethrough)
 * - Headings (H1–H4)
 * - Lists (bulleted and ordered)
 * - Text alignment (left, center, right, justify)
 * - Blockquotes
 * - Link insertion with modal dialog
 * - Word counter
 * - Form integration via hidden textarea
 * - Supports initial content via <template>
 *
 * @example
 * Basic usage:
 * ```html
 * <uk-rte name="content" placeholder="Start writing..."></uk-rte>
 * ```
 *
 * With initial content:
 * ```html
 * <uk-rte name="description">
 *   <template>
 *     <p>Initial <strong>formatted</strong> content</p>
 *   </template>
 * </uk-rte>
 * ```
 */
@customElement('uk-rte')
export class Rte extends Input {
  /**
   * Gets the current HTML content as the form value.
   * Used for form submission.
   */
  protected get $value(): string | string[] {
    return this.content;
  }

  /**
   * Returns an empty string; this component does not use display text separate from value.
   */
  protected get $text(): string {
    return '';
  }

  /**
   * Custom event name dispatched when content changes.
   * Used for form integration and change detection.
   */
  protected 'input-event': string = 'uk-rte:input';

  /**
   * Default element class key for CSS customization via `cls-custom`.
   * Targets the editor container.
   */
  protected 'cls-default-element': string = 'editor';

  /**
   * Current HTML content of the editor.
   * Synced with the TipTap editor instance.
   */
  @state()
  content: string = '';

  /**
   * Internationalization strings for UI text.
   * Can be customized for localization.
   */
  @state()
  $i18n: I18N = {
    'link-insert': 'Insert Link',
    'link-save': 'Save',
    'link-remove': 'Remove',
    'link-form-label': 'URL',
    'link-placeholder': 'https://www.example.com',
    'word-counter-singular': 'word',
    'word-counter-plural': 'words',
    'tooltip-bold': 'Bold',
    'tooltip-italic': 'Italic',
    'tooltip-underline': 'Underline',
    'tooltip-strikethrough': 'Strikethrough',
    'tooltip-list': 'List',
    'tooltip-list-ordered': 'Ordered List',
    'tooltip-h1': 'Heading 1',
    'tooltip-h2': 'Heading 2',
    'tooltip-h3': 'Heading 3',
    'tooltip-h4': 'Heading 4',
    'tooltip-align-left': 'Align Left',
    'tooltip-align-center': 'Align Center',
    'tooltip-align-right': 'Align Right',
    'tooltip-align-justify': 'Align Justify',
    'tooltip-blockquote': 'Blockquote',
  };

  /**
   * CSS class mappings for component elements.
   * Use with `cls-custom` for styling.
   */
  @state()
  $cls: Cls = {
    editor: '',
  };

  /**
   * Unique ID for the link insertion modal.
   * Prevents conflicts when multiple editors are present.
   */
  private insertLink: string = 'uk-rte-link';

  /**
   * TipTap editor instance.
   * Provides the editing functionality and state.
   */
  private editor: Editor | null = null;

  /**
   * Current URL being edited in the link modal dialog.
   */
  private url: string = '';

  /**
   * Reference to the <template> element for initial content, if present.
   */
  private HTMLTemplate: Element | null = null;

  /**
   * Lifecycle: Called when the element is added to the DOM.
   * Initializes superclass logic.
   */
  connectedCallback(): void {
    super.connectedCallback();
  }

  /**
   * Lifecycle: Called after the first render.
   * Initializes the TipTap editor and sets up unique modal IDs.
   *
   * @param _changedProperties - Properties that changed in this update
   */
  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.initializeEditor();
    this.setupUniqueModalId();
  }

  /**
   * Initializes the component value from a <template> child, if present.
   * Used for setting initial editor content.
   */
  protected initializeValue(): void {
    this.HTMLTemplate = this.renderRoot.querySelector('template');

    if (this.HTMLTemplate) {
      this.content = this.HTMLTemplate.innerHTML;
    }
  }

  /**
   * Creates and configures the TipTap editor instance.
   * Sets up extensions, placeholder, and event handlers.
   */
  private initializeEditor(): void {
    this.editor = new Editor({
      editorProps: {
        attributes: {
          class: this.$cls.editor,
        },
      },
      element: this.renderRoot.querySelector(`.uk-rte-body`) as Element,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: this.placeholder,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        CharacterCount,
        Link.configure({
          openOnClick: false,
          defaultProtocol: 'https',
        }),
      ],
      content: this.content,
      onTransaction: () => {
        this.updateLinkUrl();
        this.requestUpdate();
      },
      onUpdate: ({ editor }) => {
        this.handleContentChange(editor);
      },
    });
  }

  /**
   * Updates the link URL state when the editor selection changes.
   * Used for link editing modal.
   */
  private updateLinkUrl(): void {
    if (this.editor?.getAttributes('link').href !== undefined) {
      this.url = this.editor?.getAttributes('link').href;
    } else {
      this.url = '';
    }
  }

  /**
   * Handles editor content changes and dispatches a custom input event.
   *
   * @param editor - The TipTap editor instance
   */
  private handleContentChange(editor: Editor): void {
    this.content = editor.getHTML();
    this.dispatchEvent(
      new CustomEvent('uk-rte:input', {
        detail: { value: editor.getHTML() },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Sets up a unique modal ID for the link dialog to avoid conflicts with multiple editors.
   */
  private setupUniqueModalId(): void {
    const insertLinks = document.querySelectorAll('#uk-rte-link').length;

    if (insertLinks > 1) {
      this.insertLink = `uk-rte-link-${insertLinks}`;
    }
  }

  /**
   * Renders the heading icon for a given heading level.
   *
   * @param level - Heading level (1–4)
   * @returns HTML template for the heading icon
   */
  private renderHeadingIcon(level: number) {
    switch (level) {
      case 1:
        return this.$icons('heading-1');
      case 2:
        return this.$icons('heading-2');
      case 3:
        return this.$icons('heading-3');
      case 4:
        return this.$icons('heading-4');
    }
  }

  /**
   * Renders the alignment icon for a given alignment direction.
   *
   * @param alignment - Text alignment direction
   * @returns HTML template for the alignment icon
   */
  private renderAlignmentIcon(
    alignment: 'Left' | 'Right' | 'Center' | 'Justify',
  ) {
    switch (alignment) {
      case 'Left':
        return this.$icons('align-left');
      case 'Right':
        return this.$icons('align-right');
      case 'Center':
        return this.$icons('align-center');
      case 'Justify':
        return this.$icons('align-justify');
    }
  }

  /**
   * Handles input changes in the link URL field within the modal dialog.
   *
   * @param e - Input event from the URL input field
   */
  private handleUrlInput(e: InputEvent): void {
    const input = e.target as HTMLInputElement;
    this.url = input.value;
  }

  /**
   * Saves or removes a link based on the current URL value.
   * If the URL is empty, removes the link; otherwise, sets the link.
   */
  private handleLinkSave(): void {
    if (this.url === '') {
      this.editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    this.editor
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: this.url })
      .run();
  }

  /**
   * Removes the current link from the selection.
   */
  private handleLinkRemove(): void {
    this.editor?.chain().focus().extendMarkRange('link').unsetLink().run();
  }

  /**
   * Toggles bold formatting for the current selection.
   */
  private toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  /**
   * Toggles italic formatting for the current selection.
   */
  private toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  /**
   * Toggles underline formatting for the current selection.
   */
  private toggleUnderline(): void {
    this.editor?.chain().focus().toggleUnderline().run();
  }

  /**
   * Toggles strikethrough formatting for the current selection.
   */
  private toggleStrike(): void {
    this.editor?.chain().focus().toggleStrike().run();
  }

  /**
   * Toggles a bulleted list for the current selection.
   */
  private toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  /**
   * Toggles an ordered list for the current selection.
   */
  private toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  /**
   * Toggles a heading at the specified level for the current selection.
   *
   * @param level - Heading level (1–4)
   */
  private toggleHeading(level: 1 | 2 | 3 | 4): void {
    this.editor?.chain().focus().toggleHeading({ level }).run();
  }

  /**
   * Sets the text alignment for the current block.
   *
   * @param alignment - Alignment direction (e.g., 'left', 'center')
   */
  private setTextAlign(alignment: string): void {
    this.editor?.chain().focus().setTextAlign(alignment).run();
  }

  /**
   * Toggles blockquote formatting for the current selection.
   */
  private toggleBlockquote(): void {
    this.editor?.chain().focus().toggleBlockquote().run();
  }

  /**
   * Gets the current word count from the editor content.
   *
   * @returns Number of words in the editor
   */
  private getWordCount(): number {
    return (
      this.editor?.storage.characterCount.words({
        node: this.editor.state.doc,
      }) ?? 0
    );
  }

  /**
   * Gets the localized word counter label (singular or plural).
   *
   * @returns Localized word counter label
   */
  private getWordCounterLabel(): string {
    const wordCount = this.getWordCount();
    return wordCount === 1
      ? this.$i18n['word-counter-singular']
      : this.$i18n['word-counter-plural'];
  }

  /**
   * Internal icon repository for the component.
   *
   * Returns SVG icons as Lit HTML templates for consistent rendering across the component.
   * Icons are defined inline to avoid external dependencies and ensure reliability.
   *
   * @param icon - The name of the icon to retrieve.
   * @returns A Lit HTML template containing the requested SVG icon.
   *
   * @example
   * Usage in a render method:
   * ```typescript
   * render() {
   *   return html`
   *     <button>${this.$icons('plus')} Save</button>
   *   `;
   * }
   * ```
   */
  protected $icons(icon: string) {
    switch (icon) {
      case 'heading-1':
        return html`
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
          >
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="m17 12 3-2v8" />
          </svg>
        `;
      case 'heading-2':
        return html`
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
          >
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
          </svg>
        `;
      case 'heading-3':
        return html`
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
          >
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
            <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
          </svg>
        `;
      case 'heading-4':
        return html`
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
          >
            <path d="M12 18V6" />
            <path d="M17 10v3a1 1 0 0 0 1 1h3" />
            <path d="M21 10v8" />
            <path d="M4 12h8" />
            <path d="M4 18V6" />
          </svg>
        `;
      case 'align-center':
        return html`
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
          >
            <path d="M17 12H7" />
            <path d="M19 18H5" />
            <path d="M21 6H3" />
          </svg>
        `;
      case 'align-justify':
        return html`
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
          >
            <path d="M3 12h18" />
            <path d="M3 18h18" />
            <path d="M3 6h18" />
          </svg>
        `;
      case 'align-left':
        return html`
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
          >
            <path d="M15 12H3" />
            <path d="M17 18H3" />
            <path d="M21 6H3" />
          </svg>
        `;
      case 'align-right':
        return html`
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
          >
            <path d="M21 12H9" />
            <path d="M21 18H7" />
            <path d="M21 6H3" />
          </svg>
        `;
      case 'bold':
        return html`
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
          >
            <path
              d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"
            />
          </svg>
        `;
      case 'italic':
        return html`
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
          >
            <line x1="19" x2="10" y1="4" y2="4" />
            <line x1="14" x2="5" y1="20" y2="20" />
            <line x1="15" x2="9" y1="4" y2="20" />
          </svg>
        `;
      case 'underline':
        return html`
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
          >
            <path d="M6 4v6a6 6 0 0 0 12 0V4" />
            <line x1="4" x2="20" y1="20" y2="20" />
          </svg>
        `;
      case 'strikethrough':
        return html`
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
          >
            <path d="M16 4H9a3 3 0 0 0-2.83 4" />
            <path d="M14 12a4 4 0 0 1 0 8H6" />
            <line x1="4" x2="20" y1="12" y2="12" />
          </svg>
        `;
      case 'list':
        return html`
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
          >
            <path d="M3 12h.01" />
            <path d="M3 18h.01" />
            <path d="M3 6h.01" />
            <path d="M8 12h13" />
            <path d="M8 18h13" />
            <path d="M8 6h13" />
          </svg>
        `;
      case 'list-ordered':
        return html`
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
          >
            <path d="M10 12h11" />
            <path d="M10 18h11" />
            <path d="M10 6h11" />
            <path d="M4 10h2" />
            <path d="M4 6h1v4" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </svg>
        `;
      case 'text-quote':
        return html`
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
          >
            <path d="M17 6H3" />
            <path d="M21 12H8" />
            <path d="M21 18H8" />
            <path d="M3 12v6" />
          </svg>
        `;
      case 'link':
        return html`
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
          >
            <path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
            />
            <path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            />
          </svg>
        `;
    }
  }

  /**
   * Renders the complete rich text editor interface, including toolbar, editor area, word counter, and hidden textarea for forms.
   */
  render() {
    return html`
      <div data-host-inner class="uk-rte">
        <!-- Link insertion modal -->
        <div class="uk-modal" id="${this.insertLink}" data-uk-modal>
          <div class="uk-modal-dialog">
            <div class="uk-modal-header">
              <div class="uk-modal-title">${this.$i18n['link-insert']}</div>
            </div>
            <div class="uk-modal-body">
              <div>
                <label class="uk-form-label" for="${this.insertLink}-url">
                  ${this.$i18n['link-form-label']}
                </label>
                <div class="uk-form-controls mt-2">
                  <input
                    autofocus
                    class="uk-input"
                    id="${this.insertLink}-url"
                    type="text"
                    placeholder="${this.$i18n['link-placeholder']}"
                    .value="${this.url}"
                    @input=${this.handleUrlInput.bind(this)}
                  />
                </div>
              </div>
            </div>
            <div class="uk-modal-footer">
              <button
                type="button"
                class="uk-modal-close uk-btn uk-btn-default"
                @click="${this.handleLinkSave.bind(this)}"
              >
                ${this.$i18n['link-save']}
              </button>
              ${this.editor?.getAttributes('link').href
                ? html`
                    <button
                      type="button"
                      class="uk-modal-close uk-btn uk-btn-destructive"
                      @click="${this.handleLinkRemove.bind(this)}"
                    >
                      ${this.$i18n['link-remove']}
                    </button>
                  `
                : ''}
            </div>
          </div>
        </div>

        <!-- Toolbar (only shown when editor is initialized) -->
        ${this.editor !== null
          ? html`
              <div class="uk-rte-header">
                <div class="uk-rte-toolbar">
                  <!-- Text formatting buttons -->
                  <div class="uk-btn-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('bold')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${this.toggleBold.bind(this)}"
                      data-uk-tooltip="${this.$i18n['tooltip-bold']}"
                    >
                      ${this.$icons('bold')}
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('italic')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${this.toggleItalic.bind(this)}"
                      data-uk-tooltip="${this.$i18n['tooltip-italic']}"
                    >
                      ${this.$icons('italic')}
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('underline')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${this.toggleUnderline.bind(this)}"
                      data-uk-tooltip="${this.$i18n['tooltip-underline']}"
                    >
                      ${this.$icons('underline')}
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('strike')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${this.toggleStrike.bind(this)}"
                      data-uk-tooltip="${this.$i18n['tooltip-strikethrough']}"
                    >
                      ${this.$icons('strikethrough')}
                    </button>
                  </div>

                  <!-- List buttons -->
                  <div class="uk-btn-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('bulletList')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${this.toggleBulletList.bind(this)}"
                      data-uk-tooltip="${this.$i18n['tooltip-list']}"
                    >
                      ${this.$icons('list')}
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('orderedList')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${this.toggleOrderedList.bind(this)}"
                      data-uk-tooltip="${this.$i18n['tooltip-list-ordered']}"
                    >
                      ${this.$icons('list-ordered')}
                    </button>
                  </div>

                  <!-- Heading buttons -->
                  <div class="uk-btn-group">
                    ${Array.from({ length: 4 }, (_, i) => i + 1).map(level => {
                      const headingLevel = level as 1 | 2 | 3 | 4;
                      return html`
                        <button
                          class="${this.editor?.isActive('heading', {
                            level: headingLevel,
                          })
                            ? 'uk-active'
                            : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                          @click="${() => this.toggleHeading(headingLevel)}"
                          data-uk-tooltip="${this.$i18n[
                            `tooltip-h${headingLevel}`
                          ]}"
                        >
                          ${this.renderHeadingIcon(headingLevel)}
                        </button>
                      `;
                    })}
                  </div>

                  <!-- Alignment buttons -->
                  <div class="uk-btn-group">
                    ${['Left', 'Right', 'Center', 'Justify'].map(alignment => {
                      const alignKey = `tooltip-align-${alignment.toLowerCase()}`;
                      return html`
                        <button
                          class="${this.editor?.isActive({
                            textAlign: alignment.toLowerCase(),
                          })
                            ? 'uk-active'
                            : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                          @click="${() =>
                            this.setTextAlign(alignment.toLowerCase())}"
                          data-uk-tooltip="${this.$i18n[
                            alignKey as keyof I18N
                          ]}"
                        >
                          ${this.renderAlignmentIcon(
                            alignment as
                              | 'Left'
                              | 'Right'
                              | 'Center'
                              | 'Justify',
                          )}
                        </button>
                      `;
                    })}
                  </div>

                  <!-- Special formatting buttons -->
                  <div class="uk-btn-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('blockquote')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${this.toggleBlockquote.bind(this)}"
                      data-uk-tooltip="${this.$i18n['tooltip-blockquote']}"
                    >
                      ${this.$icons('text-quote')}
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('link')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      data-uk-toggle="target: #${this.insertLink}"
                      data-uk-tooltip="${this.$i18n['link-insert']}"
                    >
                      ${this.$icons('link')}
                    </button>
                  </div>
                </div>
              </div>
            `
          : ''}

        <!-- Editor content area -->
        <div class="uk-rte-body"></div>

        <!-- Word counter footer -->
        ${this.editor !== null
          ? html`
              <div class="uk-rte-footer">
                ${this.getWordCount()} ${this.getWordCounterLabel()}
              </div>
            `
          : ''}

        <!-- Hidden textarea for form submission -->
        ${this.name
          ? html`
              <textarea name="${this.name}" hidden>${this.content}</textarea>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-rte': Rte;
  }
}
