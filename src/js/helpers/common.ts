export function parseOptions(value: string): object {
  try {
    if (value.startsWith("{")) {
      return JSON.parse(value);
    }

    const result: { [key: string]: string } = {};

    value.split(";").forEach((a) => {
      const b = a.trim().split(/:(.*)/);

      result[b[0].trim()] = b[1].trim();
    });

    return result;
  } catch (e) {
    return {};
  }
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
      "none",
      "hidden",
      "dotted",
      "dashed",
      "solid",
      "double",
      "groove",
      "ridge",
      "inset",
      "outset",
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
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
}
