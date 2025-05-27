import { state } from 'lit/decorators.js';
import { Base } from './base';

/**
 * Configuration object type for storing theme settings.
 * Maps theme groups to their selected values.
 */
export type LSHConfig = {
  [group: string]: string;
};

/**
 * Base class for theme management components.
 *
 * Provides common functionality for:
 * - Loading/saving theme configuration from/to localStorage
 * - Managing CSS classes on document.documentElement
 * - Special handling for 'mode' group (light/dark theme)
 * - Emitting change events
 *
 * @abstract
 * @extends {Base}
 */
export abstract class BaseLsh extends Base {
  protected abstract readonly 'change-event': string;

  /**
   * Current localStorage configuration state.
   * Automatically loaded and synchronized with localStorage.
   */
  @state()
  protected $config: LSHConfig = {};

  /**
   * Lit lifecycle: Component connected to DOM.
   * Loads configuration from localStorage and initializes mode from DOM state.
   */
  connectedCallback(): void {
    super.connectedCallback();
    this.initializeConfiguration();
  }

  /**
   * Initializes configuration from localStorage and current DOM state.
   * Sets initial 'mode' based on existing 'dark' class on document.documentElement.
   * @protected
   */
  protected initializeConfiguration(): void {
    // Initialize mode based on current document state
    this.$config['mode'] = document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';

    // Load saved configuration from localStorage
    const storedConfig = localStorage.getItem('__FRANKEN__');
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      Object.keys(parsed).forEach(key => {
        this.$config[key] = parsed[key];
      });
    }
  }

  /**
   * Saves the current configuration to localStorage.
   * @protected
   */
  protected saveConfiguration(): void {
    localStorage.setItem('__FRANKEN__', JSON.stringify(this.$config));
  }

  /**
   * Applies a theme value by updating document classes and localStorage.
   *
   * For 'mode' group:
   * - 'light': Removes 'dark' class
   * - 'dark': Adds 'dark' class
   *
   * For other groups:
   * - Removes any existing class with the group prefix
   * - Adds the new value class
   *
   * @param group - The theme group (e.g., 'mode', 'uk-theme', 'uk-size')
   * @param value - The value to apply
   * @protected
   */
  protected applyThemeValue(group: string, value: string): void {
    if (!group || !value) return;

    const head = document.documentElement;

    // Update configuration
    this.$config[group] = value;

    if (group === 'mode') {
      // Special handling for light/dark mode
      if (value === 'light') {
        head.classList.remove('dark');
      } else if (value === 'dark') {
        head.classList.add('dark');
      }
    } else {
      // Handle other theme groups with prefixed classes
      // Remove existing class that starts with the value's prefix
      const prefix = value.split('-').slice(0, 2).join('-') + '-'; // e.g., "uk-theme-"
      const existingClass = Array.from(head.classList).find(cls =>
        cls.startsWith(prefix),
      );

      if (existingClass) {
        head.classList.remove(existingClass);
      }

      head.classList.add(value);
    }

    // Persist to localStorage
    this.saveConfiguration();

    // Emit change event
    this.emitChangeEvent(group, value);
  }

  /**
   * Checks if a specific group/value combination is currently active.
   *
   * @param group - The theme group to check
   * @param value - The value to check
   * @returns True if the group/value combination is active
   * @protected
   */
  protected isValueActive(group: string, value: string): boolean {
    if (!group || !value) return false;

    if (group === 'mode') {
      // Special handling for mode: check document class state
      const isDarkMode = document.documentElement.classList.contains('dark');
      return (
        (value === 'dark' && isDarkMode) || (value === 'light' && !isDarkMode)
      );
    } else {
      // Regular group: check if our value matches stored config
      return this.$config[group] === value;
    }
  }

  /**
   * Emits a change event when theme configuration changes.
   * Can be overridden by subclasses to customize event details.
   *
   * @param group - The theme group that changed
   * @param value - The new value
   * @protected
   */
  protected emitChangeEvent(group: string, value: string): void {
    this.dispatchEvent(
      new CustomEvent(this['change-event'], {
        detail: {
          group,
          value,
          config: { ...this.$config },
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
