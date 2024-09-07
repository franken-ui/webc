import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { id } from '../helpers/common';

@customElement('uk-wysiwyg')
export class Wysiwyg extends LitElement {
  @property({ type: String })
  'custom-class': string = '';

  @property({ type: String })
  name: string = '';

  @property({ type: String })
  placeholder: string = 'Content';

  @state()
  content: string = '';

  private modal: string;

  private editor: Editor | null = null;

  private url: string = '';

  constructor() {
    super();

    this.modal = id();
  }

  connectedCallback(): void {
    super.connectedCallback();

    this.content = this.innerHTML.trim();
    this.innerHTML = '';

    this.removeAttribute('uk-cloak');
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.editor = new Editor({
      editorProps: {
        attributes: {
          class: this['custom-class'],
        },
      },
      element: this.renderRoot.querySelector(`.uk-tiptap-body`) as Element,
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
          new CustomEvent('uk-tiptap:input', {
            detail: { value: editor.getHTML() },
            bubbles: true,
            composed: true,
          }),
        );
      },
    });
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this;
  }

  render() {
    return html`
      <div class="uk-tiptap">
        <div class="uk-modal" id="${this.modal}" uk-modal>
          <div class="uk-modal-dialog uk-modal-body">
            <div class="uk-modal-title">Insert Link</div>
            <button
              class="uk-modal-close-default"
              type="button"
              uk-close
            ></button>

            <div class="uk-margin">
              <div class="uk-flex uk-flex-middle">
                <label
                  class="uk-form-label uk-margin-small-right"
                  for="${this.modal}-url"
                  >URL</label
                >
                <div class="uk-flex-1 uk-form-controls">
                  <input
                    class="uk-input"
                    id="${this.modal}-url"
                    type="text"
                    placeholder="https://www.example.com"
                    .value="${this.url}"
                    @input=${(e: InputEvent) => {
                      const input = e.target as HTMLInputElement;

                      this.url = input.value;
                    }}
                  />
                </div>
              </div>
            </div>

            <div class="uk-margin">
              <button
                type="button"
                class="uk-modal-close uk-button uk-button-primary"
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
                Save
              </button>
              ${this.editor?.getAttributes('link').href
                ? html`
                    <button
                      type="button"
                      class="uk-modal-close uk-button uk-button-danger"
                      @click="${() => {
                        this.editor
                          ?.chain()
                          .focus()
                          .extendMarkRange('link')
                          .unsetLink()
                          .run();
                      }}"
                    >
                      Remove
                    </button>
                  `
                : ''}
            </div>
          </div>
        </div>

        ${this.editor !== null
          ? html`
              <div class="uk-tiptap-header">
                <div class="uk-tiptap-toolbar">
                  <div class="uk-tiptap-toolbar-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('bold')
                        ? 'uk-active'
                        : ''}"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleBold().run()}"
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
                        : ''}"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleItalic().run()}"
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
                        : ''}"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleUnderline().run()}"
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
                      >
                        <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                        <line x1="4" x2="20" y1="20" y2="20" />
                      </svg>
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('strike')
                        ? 'uk-active'
                        : ''}"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleStrike().run()}"
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
                      >
                        <path d="M16 4H9a3 3 0 0 0-2.83 4" />
                        <path d="M14 12a4 4 0 0 1 0 8H6" />
                        <line x1="4" x2="20" y1="12" y2="12" />
                      </svg>
                    </button>
                  </div>
                  <div class="uk-tiptap-toolbar-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('bulletList')
                        ? 'uk-active'
                        : ''}"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleBulletList().run()}"
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
                      >
                        <line x1="8" x2="21" y1="6" y2="6" />
                        <line x1="8" x2="21" y1="12" y2="12" />
                        <line x1="8" x2="21" y1="18" y2="18" />
                        <line x1="3" x2="3.01" y1="6" y2="6" />
                        <line x1="3" x2="3.01" y1="12" y2="12" />
                        <line x1="3" x2="3.01" y1="18" y2="18" />
                      </svg>
                    </button>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('orderedList')
                        ? 'uk-active'
                        : ''}"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleOrderedList().run()}"
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
                      >
                        <line x1="10" x2="21" y1="6" y2="6" />
                        <line x1="10" x2="21" y1="12" y2="12" />
                        <line x1="10" x2="21" y1="18" y2="18" />
                        <path d="M4 6h1v4" />
                        <path d="M4 10h2" />
                        <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
                      </svg>
                    </button>
                  </div>
                  <div class="uk-tiptap-toolbar-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('heading')
                        ? 'uk-active'
                        : ''}"
                      type="button"
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
                      >
                        <path d="M6 12h12" />
                        <path d="M6 20V4" />
                        <path d="M18 20V4" />
                      </svg>
                    </button>
                    <div
                      class="uk-drop uk-dropdown"
                      uk-dropdown="mode: click; shift: false; flip: false; pos: bottom-left"
                    >
                      <ul class="uk-dropdown-nav uk-nav">
                        ${Array.from({ length: 4 }, (_, i) => i + 1).map(a => {
                          const b = a as 1 | 2 | 3 | 4;

                          return html`
                            <li
                              class="${this.editor?.isActive('heading', {
                                level: b,
                              })
                                ? 'uk-active'
                                : ''}"
                            >
                              <a
                                class="uk-drop-close"
                                @click="${() => {
                                  this.editor
                                    ?.chain()
                                    .focus()
                                    .toggleHeading({ level: b })
                                    .run();
                                }}"
                                >Heading ${b}</a
                              >
                            </li>
                          `;
                        })}
                      </ul>
                    </div>
                    <button
                      tabindex="-1"
                      class="${!this.editor?.isActive({ textAlign: 'left' })
                        ? 'uk-active'
                        : ''}"
                      type="button"
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
                      >
                        <line x1="21" x2="3" y1="6" y2="6" />
                        <line x1="15" x2="3" y1="12" y2="12" />
                        <line x1="17" x2="3" y1="18" y2="18" />
                      </svg>
                    </button>
                    <div
                      class="uk-drop uk-dropdown"
                      uk-dropdown="mode: click; shift: false; flip: false; pos: bottom-left"
                    >
                      <ul class="uk-dropdown-nav uk-nav">
                        ${['Left', 'Right', 'Center', 'Justify'].map(a => {
                          return html`
                            <li
                              class="${this.editor?.isActive({
                                textAlign: a.toLowerCase(),
                              })
                                ? 'uk-active'
                                : ''}"
                            >
                              <a
                                class="uk-drop-close"
                                @click="${() => {
                                  this.editor
                                    ?.chain()
                                    .focus()
                                    .setTextAlign(a.toLowerCase())
                                    .run();
                                }}"
                              >
                                ${a}
                              </a>
                            </li>
                          `;
                        })}
                      </ul>
                    </div>
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('blockquote')
                        ? 'uk-active'
                        : ''}"
                      type="button"
                      @click="${() =>
                        this.editor?.chain().focus().toggleBlockquote().run()}"
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
                      >
                        <path
                          d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
                        />
                        <path
                          d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"
                        />
                      </svg>
                    </button>
                  </div>
                  <div class="uk-tiptap-toolbar-group">
                    <button
                      tabindex="-1"
                      class="${this.editor?.isActive('link')
                        ? 'uk-active'
                        : ''}"
                      type="button"
                      uk-toggle="target: #${this.modal}"
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

        <div class="uk-tiptap-body"></div>

        ${this.editor !== null
          ? html`
              <div class="uk-tiptap-footer">
                ${this.editor !== null
                  ? this.editor.storage.characterCount.words()
                  : '0'}
                words
              </div>
            `
          : ''}
        ${this.name
          ? html`<input
              name="${this.name}"
              type="hidden"
              .value=${this.content}
            />`
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'uk-wysiwyg': Wysiwyg;
  }
}
