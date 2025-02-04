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

export interface OptionGrouped {
  [key: string]: {
    text: string;
    options: OptionItem[];
  };
}

export function selectToJson(select: HTMLSelectElement): OptionGrouped {
  const options: OptionGrouped = {};

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

    if (!options[key]) {
      options[key] = { text: label, options: [] };
    }

    options[key].options.push({
      group: key,
      value,
      text: option.textContent!,
      disabled: isOptGroupDisabled === true ? true : option.disabled,
      selected: option.hasAttribute('selected'),
      data,
    });
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

  return options;
}
