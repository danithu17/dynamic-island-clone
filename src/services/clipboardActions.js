/**
 * Aura Island - Clipboard Type Detection and Quick Actions
 * Pure logic module for smart clipboard transformations
 */

export function detectClipboardType(text) {
  if (typeof text !== "string" || !text.trim()) {
    return "empty";
  }

  const trimmed = text.trim();

  // 1. JSON check
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch (_) {}
  }

  // 2. URL check
  if (/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed) || /^file:\/\/\/[^\s]*/i.test(trimmed)) {
    return "url";
  }

  // 3. Hex Color check (#fff, #ffffff, #ffffff80)
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return "hex-color";
  }

  // 4. Number check
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return "number";
  }

  // 5. Base64 check (length multiple of 4, valid chars, decodes cleanly)
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length >= 8 && trimmed.length % 4 === 0) {
    try {
      const decoded = typeof Buffer !== "undefined"
        ? Buffer.from(trimmed, "base64").toString("utf8")
        : atob(trimmed);
      // Ensure decoded contains mostly printable characters
      if (/^[\x20-\x7E\r\n\t]+$/.test(decoded)) {
        return "base64";
      }
    } catch (_) {}
  }

  return "text";
}

export function applyQuickAction(text, action) {
  if (typeof text !== "string") return "";

  switch (action) {
    case "format-json": {
      try {
        const parsed = JSON.parse(text.trim());
        return JSON.stringify(parsed, null, 2);
      } catch (err) {
        throw new Error("Invalid JSON: Cannot format");
      }
    }

    case "minify-json": {
      try {
        const parsed = JSON.parse(text.trim());
        return JSON.stringify(parsed);
      } catch (err) {
        throw new Error("Invalid JSON: Cannot minify");
      }
    }

    case "to-base64": {
      return typeof Buffer !== "undefined"
        ? Buffer.from(text, "utf8").toString("base64")
        : btoa(unescape(encodeURIComponent(text)));
    }

    case "from-base64": {
      try {
        return typeof Buffer !== "undefined"
          ? Buffer.from(text.trim(), "base64").toString("utf8")
          : decodeURIComponent(escape(atob(text.trim())));
      } catch (err) {
        throw new Error("Invalid Base64: Cannot decode");
      }
    }

    case "to-uppercase": {
      return text.toUpperCase();
    }

    case "to-lowercase": {
      return text.toLowerCase();
    }

    case "to-titlecase": {
      return text.replace(/\b[a-z]/g, (char) => char.toUpperCase());
    }

    default:
      return text;
  }
}
