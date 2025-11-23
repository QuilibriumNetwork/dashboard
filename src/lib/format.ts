export function formatBytesLike(hex: string | undefined) {
  if (!hex) return "–";
  if (hex.length <= 12) return hex;
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
}

export function base64ToHex(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
    const padded = padding ? `${normalized}${"=".repeat(padding)}` : normalized;
    const decoder = typeof atob === "function" ? atob : null;
    if (!decoder) {
      return null;
    }
    const binary = decoder(padded);
    let hex = "";
    for (let idx = 0; idx < binary.length; idx += 1) {
      hex += binary.charCodeAt(idx).toString(16).padStart(2, "0");
    }
    return hex;
  } catch {
    return null;
  }
}

export function formatBase64Bytes(value?: string) {
  if (!value) return "–";
  const hex = base64ToHex(value);
  const shortened = formatBytesLike(hex ?? value);
  return `0x${shortened}`;
}

export function coerceTimestamp(value?: string) {
  if (!value) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatTimestamp(value?: string) {
  const ts = coerceTimestamp(value);
  if (ts === null) return "–";
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
  return formatter.format(new Date(ts));
}

export function formatRelative(value?: string) {
  const ts = coerceTimestamp(value);
  if (ts === null) return "";
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const now = Date.now();
  const diffMinutes = Math.round((ts - now) / 60000);
  return formatter.format(diffMinutes, "minute");
}
