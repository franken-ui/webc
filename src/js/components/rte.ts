import { PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Input } from './shared/input';

type I18N = {
  'link-insert': string;
  'link-save': string;
  'link-remove': string;
  'link-form-label': string;
  'link-placeholder': string;
  'word-counter-singular': string;
  'word-counter-plural': string;
};

type Cls = {
  editor: string;
};

@customElement('uk-rte')
export class Rte extends Input {
  protected get $value(): string | string[] {
    return this.content;
  }

  protected get $text(): string {
    return '';
  }

  protected 'input-event': string = 'uk-rte:input';

  protected initializeValue(): void {
    this.HTMLTemplate = this.renderRoot.querySelector('template');

    if (this.HTMLTemplate) {
      this.content = this.HTMLTemplate.innerHTML;
    }
  }

  protected 'cls-default-element': string = 'editor';

  @state()
  content: string = '';

  @state()
  $i18n: I18N = {
    'link-insert': 'Insert Link',
    'link-save': 'Save',
    'link-remove': 'Remove',
    'link-form-label': 'URL',
    'link-placeholder': 'https://www.example.com',
    'word-counter-singular': 'word',
    'word-counter-plural': 'words',
  };

  @state()
  $cls: Cls = {
    editor: '',
  };

  private insertLink: string = 'uk-rte-link';

  private editor: Editor | null = null;

  private url: string = '';

  private HTMLTemplate: Element | null = null;

  connectedCallback(): void {
    super.connectedCallback();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
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
        if (this.editor?.getAttributes('link').href !== undefined) {
          this.url = this.editor?.getAttributes('link').href;
        } else {
          this.url = '';
        }

        this.requestUpdate();
      },
      onUpdate: ({ editor }) => {
        this.content = editor.getHTML();
        this.dispatchEvent(
          new CustomEvent('uk-rte:input', {
            detail: { value: editor.getHTML() },
            bubbles: true,
            composed: true,
          }),
        );
      },
    });

    const insertLinks = document.querySelectorAll('#uk-rte-link').length;

    if (insertLinks > 1) {
      this.insertLink = `uk-rte-link-${insertLinks}`;
    }
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  private renderHeadingIcon(level: number) {
    switch (level) {
      case 1:
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
            class="lucide lucide-heading-1"
          >
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="m17 12 3-2v8" />
          </svg>
        `;
      case 2:
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
            class="lucide lucide-heading-2"
          >
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
          </svg>
        `;
      case 3:
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
            class="lucide lucide-heading-3"
          >
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
            <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
          </svg>
        `;
      case 4:
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
            class="lucide lucide-heading-4"
          >
            <path d="M12 18V6" />
            <path d="M17 10v3a1 1 0 0 0 1 1h3" />
            <path d="M21 10v8" />
            <path d="M4 12h8" />
            <path d="M4 18V6" />
          </svg>
        `;
    }
  }

  private renderAlignmentIcon(
    alignment: 'Left' | 'Right' | 'Center' | 'Justify',
  ) {
    switch (alignment) {
      case 'Left':
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
            class="lucide lucide-align-left"
          >
            <path d="M15 12H3" />
            <path d="M17 18H3" />
            <path d="M21 6H3" />
          </svg>
        `;
      case 'Right':
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
            class="lucide lucide-align-right"
          >
            <path d="M21 12H9" />
            <path d="M21 18H7" />
            <path d="M21 6H3" />
          </svg>
        `;
      case 'Center':
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
            class="lucide lucide-align-center"
          >
            <path d="M17 12H7" />
            <path d="M19 18H5" />
            <path d="M21 6H3" />
          </svg>
        `;
      case 'Justify':
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
            class="lucide lucide-align-justify"
          >
            <path d="M3 12h18" />
            <path d="M3 18h18" />
            <path d="M3 6h18" />
          </svg>
        `;
    }
  }

  render() {
    return html`
      <div data-host-inner class="uk-rte">
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
                <div class="uk-form-controls">
                  <input
                    autofocus
                    class="uk-input"
                    id="${this.insertLink}-url"
                    type="text"
                    placeholder="${this.$i18n['link-placeholder']}"
                    .value="${this.url}"
                    @input=${(e: InputEvent) => {
                      const input = e.target as HTMLInputElement;

                      this.url = input.value;
                    }}
                  />
                </div>
              </div>
            </div>
            <div class="uk-modal-footer">
              <button
                type="button"
                class="uk-modal-close uk-btn uk-btn-default"
                @click="${() => {
                  if (this.url === '') {
                    this.editor
                      ?.chain()
                      .focus()
                      .extendMarkRange('link')
                      .unsetLink()
                      .run();

                    return;
                  }

                  this.editor
                    ?.chain()
                    .focus()
                    .extendMarkRange('link')
                    .setLink({ href: this.url })
                    .run();
                }}"
              >
                ${this.$i18n['link-save']}
              </button>
              ${this.editor?.getAttributes('link').href
                ? html`
                    <button
                      type="button"
                      class="uk-modal-close uk-btn uk-btn-destructive"
                      @click="${() => {
                        this.editor
                          ?.chain()
                          .focus()
                          .extendMarkRange('link')
                          .unsetLink()
                          .run();
                      }}"
                    >
                      ${this.$i18n['link-remove']}
                    </button>
                  `
                : ''}
            </div>
          </div>
        </div>

        ${this.editor !== null
          ? html`
              <div class="uk-rte-header">
                <div class="uk-rte-toolbar">
                  <div class="uk-btn-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('bold')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleBold().run()}"
                      data-uk-tooltip="Bold"
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
                        class="lucide lucide-bold"
                      >
                        <path
                          d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"
                        />
                      </svg>
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('italic')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleItalic().run()}"
                      data-uk-tooltip="Italic"
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
                        class="lucide lucide-italic"
                      >
                        <line x1="19" x2="10" y1="4" y2="4" />
                        <line x1="14" x2="5" y1="20" y2="20" />
                        <line x1="15" x2="9" y1="4" y2="20" />
                      </svg>
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('underline')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleUnderline().run()}"
                      data-uk-tooltip="Underline"
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
                        class="lucide lucide-underline"
                      >
                        <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                        <line x1="4" x2="20" y1="20" y2="20" />
                      </svg>
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('strike')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleStrike().run()}"
                      data-uk-tooltip="Strikethrough"
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
                        class="lucide lucide-strikethrough"
                      >
                        <path d="M16 4H9a3 3 0 0 0-2.83 4" />
                        <path d="M14 12a4 4 0 0 1 0 8H6" />
                        <line x1="4" x2="20" y1="12" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <div class="uk-btn-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('bulletList')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleBulletList().run()}"
                      data-uk-tooltip="List"
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
                        class="lucide lucide-list"
                      >
                        <path d="M3 12h.01" />
                        <path d="M3 18h.01" />
                        <path d="M3 6h.01" />
                        <path d="M8 12h13" />
                        <path d="M8 18h13" />
                        <path d="M8 6h13" />
                      </svg>
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('orderedList')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleOrderedList().run()}"
                      data-uk-tooltip="Ordered List"
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
                        class="lucide lucide-list-ordered"
                      >
                        <path d="M10 12h11" />
                        <path d="M10 18h11" />
                        <path d="M10 6h11" />
                        <path d="M4 10h2" />
                        <path d="M4 6h1v4" />
                        <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
                      </svg>
                    </button>
                  </div>
                  <div class="uk-btn-group">
                    ${Array.from({ length: 4 }, (_, i) => i + 1).map(a => {
                      const b = a as 1 | 2 | 3 | 4;

                      return html`
                        <button
                          class="${this.editor?.isActive('heading', {
                            level: b,
                          })
                            ? 'uk-active'
                            : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                          @click="${() => {
                            this.editor
                              ?.chain()
                              .focus()
                              .toggleHeading({ level: b })
                              .run();
                          }}"
                          data-uk-tooltip="Heading ${b}"
                        >
                          ${this.renderHeadingIcon(b)}
                        </button>
                      `;
                    })}
                  </div>

                  <div class="uk-btn-group">
                    ${['Left', 'Right', 'Center', 'Justify'].map(a => {
                      return html`
                        <button
                          class="${this.editor?.isActive({
                            textAlign: a.toLowerCase(),
                          })
                            ? 'uk-active'
                            : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                          @click="${() => {
                            this.editor
                              ?.chain()
                              .focus()
                              .setTextAlign(a.toLowerCase())
                              .run();
                          }}"
                          data-uk-tooltip="Align ${a}"
                        >
                          ${this.renderAlignmentIcon(
                            a as 'Left' | 'Right' | 'Center' | 'Justify',
                          )}
                        </button>
                      `;
                    })}
                  </div>

                  <div class="uk-btn-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('blockquote')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleBlockquote().run()}"
                      data-uk-tooltip="Blockquote"
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
                        class="lucide lucide-text-quote"
                      >
                        <path d="M17 6H3" />
                        <path d="M21 12H8" />
                        <path d="M21 18H8" />
                        <path d="M3 12v6" />
                      </svg>
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('link')
                        ? 'uk-active'
                        : ''} uk-btn uk-btn-default uk-btn-icon uk-btn-sm"
                      type="button"
                      data-uk-toggle="target: #${this.insertLink}"
                      data-uk-tooltip="Insert Link"
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
                        class="lucide lucide-link"
                      >
                        <path
                          d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                        />
                        <path
                          d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            `
          : ''}

        <div class="uk-rte-body"></div>

        ${this.editor !== null
          ? html`
              <div class="uk-rte-footer">
                ${this.editor !== null
                  ? this.editor.storage.characterCount.words({
                      node: this.editor.state.doc,
                    })
                  : '0'}
                ${this.editor &&
                this.editor.storage.characterCount.words({
                  node: this.editor.state.doc,
                }) === 1
                  ? this.$i18n['word-counter-singular']
                  : this.$i18n['word-counter-plural']}
              </div>
            `
          : ''}
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
