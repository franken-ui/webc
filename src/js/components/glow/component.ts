import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { darkModeObserver } from "../../observers/dark";
import {
  parseOptions,
  validateBorderStyle,
  validateDuration,
  validateHex,
  validateSize,
} from "../../helpers/common";

@customElement("uk-glow")
export class Glow extends LitElement {
  @state()
  $mode: "light" | "dark" = "light";

  @state()
  $defaults: { [key: string]: any } = {};

  @state()
  $shouldRender: boolean = false;

  @property({ type: String })
  "border-radius": string = "0.6rem";

  @property({ type: String })
  "border-width": string = "0px";

  @property({ type: String })
  "border-style": string = "solid";

  @property({ type: String })
  "border-color": string = "#1e293b";

  @property({ type: String })
  width: string = "auto";

  @property({ type: String })
  height: string = "auto";

  @property({ type: String })
  "background-color": string = "#09090b";

  @property({ type: String })
  "glow-color": string = "#06b6d4";

  @property({ type: String })
  "glow-width": string = "0.125rem";

  @property({ type: String })
  "glow-speed": string = "10s";

  @property({ type: String })
  color: string = "#fafafa";

  connectedCallback(): void {
    super.connectedCallback();

    this.initializeDefaults();

    this.$mode = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";

    darkModeObserver.subscribe((isDark) => {
      this.$mode = isDark === true ? "dark" : "light";
    });

    this.removeAttribute("uk-cloak");
  }

  disconnectedCallback() {
    darkModeObserver.unsubscribe(() => {});
  }

  private initializeDefaults() {
    try {
      this.$defaults["colors"] = this.validateColors();
    } catch (e) {
      return console.error(e);
    }

    try {
      this.$defaults["border"] = this.validateBorder();
    } catch (e) {
      return console.error(e);
    }

    try {
      const size = this.validateSize();

      this.$defaults["width"] = size.width;
      this.$defaults["height"] = size.height;
    } catch (e) {
      return console.error(e);
    }

    try {
      const glow = this.validateGlow();

      this.$defaults["glow-width"] = glow.width;
      this.$defaults["glow-speed"] = glow.speed;
    } catch (e) {
      return console.error(e);
    }

    this.$shouldRender = true;
  }

  private validateColors() {
    const result: { [key: string]: any } = {};

    [
      { name: "background-color", value: this["background-color"] },
      { name: "glow-color", value: this["glow-color"] },
      { name: "color", value: this.color },
    ].forEach((a) => {
      const property = a.name as "background-color" | "glow-color" | "color";

      if (a.value.includes(":")) {
        const colors = parseOptions(a.value) as { light: string; dark: string };

        if (
          validateHex(colors.light) === undefined ||
          validateHex(colors.dark) === undefined
        ) {
          throw new Error(`Invalid "${property}" value.`);
        }

        result[property] = {
          light: colors.light,
          dark: colors.dark,
        };
      } else {
        if (validateHex(this[property]) === undefined) {
          throw new Error(`Invalid "${property}" value.`);
        }

        result[property] = {
          light: this[property],
          dark: this[property],
        };
      }
    });

    return result;
  }

  private validateBorder() {
    if (validateHex(this["border-color"]) === undefined) {
      throw new Error(`Invalid "border-color" value`);
    }

    if (validateBorderStyle(this["border-style"]) === undefined) {
      throw new Error(`Invalid "border-style" value`);
    }

    [
      { name: "border-radius", value: this["border-radius"] },
      { name: "border-width", value: this["border-width"] },
    ].forEach((a) => {
      const property = a.name as "border-radius" | "border-width";

      if (validateSize(this[property]) === undefined) {
        throw new Error(`Invalid "${property}" value`);
      }
    });

    const result: { [key: string]: any } = {};

    const [value, unit = "px"] = this["border-radius"].split(
      /(px|cm|mm|in|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)/
    );

    result["color"] = this["border-color"];
    result["style"] = this["border-style"];
    result["radius"] = {
      parent: `${Number(value) * 1.25}${unit}`,
      child: this["border-radius"],
    };
    result["width"] = this["border-width"];

    return result;
  }

  private validateSize(): {
    width: string;
    height: string;
  } {
    [
      { name: "width", value: this.width },
      { name: "height", value: this.height },
    ].forEach((a) => {
      const property = a.name as "width" | "height";

      if (["auto", "inherit", "initial", "unset"].includes(this[property])) {
        return;
      }

      if (validateSize(this[property]) === undefined) {
        throw new Error(`Invalid "${property}" value`);
      }
    });

    return {
      width: this.width,
      height: this.height,
    };
  }

  private validateGlow(): {
    width: string;
    speed: string;
  } {
    if (validateSize(this["glow-width"]) === undefined) {
      throw new Error(`Invalid "glow-width" value`);
    }

    if (validateDuration(this["glow-speed"]) === undefined) {
      throw new Error(`Invalid "glow-speed" value`);
    }

    return {
      width: this["glow-width"],
      speed: this["glow-speed"],
    };
  }

  render() {
    const {
      width,
      ["glow-width"]: glowWidth,
      border,
      colors,
      height,
    } = this.$defaults;

    return this.$shouldRender === true
      ? html`<style>
            .p {
              position: relative;
              z-index: 10;
              display: flex;
              align-items: center;
              overflow: hidden;
              width: ${width};
              padding: ${glowWidth};
              border-radius: ${border.radius.parent};
              border-width: ${border.width};
              border-style: ${border.style};
              border-color: ${border.color};
            }

            .p::before {
              content: "";
              position: absolute;
              inset: 0px;
              height: 100%;
              width: 100%;
              animation-name: rotate;
              animation-duration: ${this.$defaults["glow-speed"]};
              animation-timing-function: linear;
              animation-iteration-count: infinite;
              border-radius: 9999px;
              background-image: conic-gradient(
                ${colors["glow-color"][this.$mode]} 20deg,
                transparent 120deg
              );
            }

            @keyframes rotate {
              0% {
                transform: rotate(0deg) scale(10);
              }

              100% {
                transform: rotate(-360deg) scale(10);
              }
            }

            .c {
              position: relative;
              z-index: 20;
              width: 100%;
              overflow: hidden;
              height: ${height};
              background-color: ${colors["background-color"][this.$mode]};
              color: ${colors.color[this.$mode]};
              border-radius: ${border.radius.child};
            }
          </style>

          <div class="p">
            <div class="c">
              <slot></slot>
            </div>
          </div>`
      : "";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "uk-glow": Glow;
  }
}
