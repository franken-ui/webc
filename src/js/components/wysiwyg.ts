import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';

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

  private modal: string = '';

  private editor: Editor | null = null;

  private url: string = '';

  connectedCallback(): void {
    super.connectedCallback();

    this.modal = `${this.name}-wysiwyg-link`;

    if (this.hasAttribute('name') === false) {
      console.error(
        'To suppress this message, set the `name` attribute to a unique name on your `<uk-wysiwyg>`. Please see https://franken-ui.dev/docs/wysiwyg for more details.',
      );
    }

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
                      <uk-icon icon="bold"></uk-icon>
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
                      <uk-icon icon="italic"></uk-icon>
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
                      <uk-icon icon="underline"></uk-icon>
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
                      <uk-icon icon="strikethrough"></uk-icon>
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
                      <uk-icon icon="list"></uk-icon>
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
                      <uk-icon icon="list-ordered"></uk-icon>
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
                      <uk-icon icon="heading"></uk-icon>
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
                      <uk-icon icon="align-left"></uk-icon>
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
                      <uk-icon icon="quote"></uk-icon>
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
                      <uk-icon icon="link"></uk-icon>
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
