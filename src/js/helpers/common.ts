export function parseOptions(value: string): object | string {
  if (value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error('Error parsing', value);
      return {};
    }
  }

  if (value.includes(':')) {
    try {
      const result: { [key: string]: string } = {};

      value
        .replace(/[;\s]+$/, '')
        .split(';')
        .forEach(a => {
          const b = a.trim().split(/:(.*)/);

          result[b[0].trim()] = b[1].trim();
        });

      return result;
    } catch (e) {
      console.error('Error parsing', value);
      return {};
    }
  }

  return value;
}

export function validateHex(hex: string): string | undefined {
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return hex;
  }
}

export function validateSize(size: string): string | undefined {
  if (
    /^(\d*\.?\d+)(px|cm|mm|in|pt|pc|em|ex|ch|rem|vw|vh|vmin|vmax|%)$/.test(size)
  ) {
    return size;
  }
}

export function validateBorderStyle(style: string): string | undefined {
  if (
    [
      'none',
      'hidden',
      'dotted',
      'dashed',
      'solid',
      'double',
      'groove',
      'ridge',
      'inset',
      'outset',
    ].includes(style)
  ) {
    return style;
  }
}

export function validateDuration(duration: string): string | undefined {
  if (/^(\d*\.?\d+)(ms|s)$/.test(duration)) {
    return duration;
  }
}

export function id(length = 5) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length)),
  ).join('');
}

export function validateDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value)) {
    let date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    return date;
  }

  throw new Error('Invalid format');
}

export function validateTime(value: string) {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    throw new Error('Invalid time format. Use HH:MM (24-hour format)');
  }

  return value;
}

export interface OptionItemGrouped {
  [key: string]: {
    text: string;
    options: OptionItem[];
  };
}

export interface OptionData {
  keywords?: string[];
  key?: string;
  [key: string]: any;
}

export interface OptionItem {
  group: string;
  value: string;
  text: string;
  disabled: boolean;
  selected: boolean;
  data: OptionData;
}

export function selectToJson(
  select: HTMLSelectElement,
  flat: boolean = false,
): OptionItem[] | { [key: string]: { text: string; options: OptionItem[] } } {
  const flatOptions: OptionItem[] = [];
  const groupedOptions: {
    [key: string]: { text: string; options: OptionItem[] };
  } = {};

  const addOption = (
    key: string,
    label: string,
    option: HTMLOptionElement,
    isOptGroupDisabled?: boolean,
  ) => {
    const value = option.hasAttribute('value')
      ? option.getAttribute('value')!
      : option.textContent!;

    const data: OptionData = { keywords: [value] };

    Object.keys(option.dataset).forEach(attr => {
      if (attr === 'keywords') {
        data.keywords = [value, ...option.dataset.keywords!.split(',')];
      } else {
        data[attr] = option.dataset[attr];
      }
    });

    const item: OptionItem = {
      group: key,
      value,
      text: option.textContent!,
      disabled: isOptGroupDisabled === true ? true : option.disabled,
      selected: option.hasAttribute('selected'),
      data,
    };

    if (flat) {
      flatOptions.push(item);
    } else {
      if (!groupedOptions[key]) {
        groupedOptions[key] = { text: label, options: [] };
      }
      groupedOptions[key].options.push(item);
    }
  };

  Array.from(select.children).forEach(element => {
    if (element.nodeName === 'OPTGROUP') {
      const group = element as HTMLOptGroupElement;
      const key = group.dataset['key'] || group.getAttribute('label')!;
      const label = group.getAttribute('label')!;

      Array.from(group.children).forEach(child => {
        addOption(key, label, child as HTMLOptionElement, group.disabled);
      });
    } else if (element.nodeName === 'OPTION') {
      addOption('__', '__', element as HTMLOptionElement);
    }
  });

  return flat ? flatOptions : groupedOptions;
}
