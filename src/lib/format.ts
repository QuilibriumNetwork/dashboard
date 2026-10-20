export function formatBytesLike(hex: string | undefined) {
  if (!hex) return "–";
  if (hex.length <= 12) return hex;
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
}

/**
 * Formats a byte count (possibly delivered as a decimal string, since shard
 * sizes can exceed Number.MAX_SAFE_INTEGER) into a human-readable size.
 */
export function formatByteSize(input: string | number | undefined) {
  if (input === undefined || input === "") return "–";
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const decimals = size >= 100 || unit === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(decimals)} ${units[unit]}`;
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

export function formatRelativeTime(value?: string) {
  const ts = coerceTimestamp(value);
  if (ts === null) return "–";
  const now = Date.now();
  const diffMs = ts - now;
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "always" });

  if (Math.abs(diffDays) >= 1) {
    return formatter.format(diffDays, "day");
  } else if (Math.abs(diffHours) >= 1) {
    return formatter.format(diffHours, "hour");
  } else if (Math.abs(diffMinutes) >= 1) {
    return formatter.format(diffMinutes, "minute");
  } else {
    return formatter.format(diffSeconds, "second");
  }
}

/**
 * Converts base64 or hex string to IPFS CIDv0 format (Qm format)
 * CIDv0 uses: multihash (SHA-256, code 0x12) encoded in base58
 *
 * The process:
 * 1. Decode input (base64 or hex, removing 0x prefix if present) to get bytes
 * 2. Hash those bytes with SHA-256
 * 3. Create multihash: [0x12 (SHA-256 code), 0x20 (32 bytes), ...hash bytes]
 * 4. Encode multihash in base58 to get Qm format CID
 *
 * To reverse (decode Qm to multihash base64):
 * - Decode base58 to get multihash bytes
 * - Convert multihash bytes to base64
 */
export async function base64ToIPFSCID(value: string): Promise<string | null> {
  try {
    let bytes: Uint8Array;
    let isMultihash = false;

    // Check if input is hex (starts with 0x or is hex string)
    const hexPattern = /^(0x)?[0-9a-fA-F]+$/;
    const cleanedValue = value.startsWith("0x") ? value.slice(2) : value;

    if (hexPattern.test(cleanedValue) && cleanedValue.length % 2 === 0) {
      // Input is hex - convert hex to bytes
      const hex = cleanedValue.toLowerCase();
      bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
      }
      // Check if it's already a multihash (starts with 0x12 and is 34 bytes)
      if (bytes.length === 34 && bytes[0] === 0x12 && bytes[1] === 0x20) {
        isMultihash = true;
      }
    } else {
      // Input is base64 - convert base64 to bytes
      const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
      const padding = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
      const padded = padding ? `${normalized}${"=".repeat(padding)}` : normalized;
      const decoder = typeof atob === "function" ? atob : null;
      if (!decoder) {
        return null;
      }
      const binary = decoder(padded);
      bytes = new Uint8Array(binary.length);
      for (let idx = 0; idx < binary.length; idx += 1) {
        bytes[idx] = binary.charCodeAt(idx);
      }
      // Check if it's already a multihash (starts with 0x12 and is 34 bytes)
      if (bytes.length === 34 && bytes[0] === 0x12 && bytes[1] === 0x20) {
        isMultihash = true;
      }
    }

    let multihash: Uint8Array;

    if (isMultihash) {
      // Input is already a multihash, use it directly
      multihash = bytes;
    } else {
      // Hash the input bytes with SHA-256
      // Create a new ArrayBuffer to ensure compatibility
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashBytes = new Uint8Array(hashBuffer);

      // Verify hash is 32 bytes
      if (hashBytes.length !== 32) {
        return null;
      }

      // Create multihash: [0x12 (SHA-256 code), 0x20 (32 bytes length), ...hash]
      multihash = new Uint8Array(34);
      multihash[0] = 0x12; // SHA-256 multihash code
      multihash[1] = 0x20; // 32 bytes (hash length)
      multihash.set(hashBytes, 2);
    }

    // Encode multihash to base58 to get CIDv0 (Qm format)
    const { binary_to_base58 } = await import("base58-js");
    const cid = binary_to_base58(new Uint8Array(multihash.buffer));

    return cid;
  } catch {
    return null;
  }
}

/**
 * Converts IPFS CIDv0 (Qm format) back to multihash base64
 * This is the reverse of base64ToIPFSCID - converts Qm CID to multihash base64
 */
export async function ipfsCIDToBase64(cid: string): Promise<string | null> {
  try {
    // Decode base58 CID to get multihash bytes
    const { base58_to_binary } = await import("base58-js");
    const multihashBytes = base58_to_binary(cid);

    // Convert multihash bytes to base64
    const binary = String.fromCharCode(...multihashBytes);
    const encoder = typeof btoa === "function" ? btoa : null;
    if (!encoder) {
      return null;
    }
    return encoder(binary);
  } catch {
    return null;
  }
}

/**
 * Recursively converts base64 strings in an object to hex format (with 0x prefix)
 */
export function convertBase64ToHex(obj: unknown): unknown {
  if (obj == null) {
    return obj;
  }

  if (typeof obj === "string") {
    // Check if it looks like base64 (matches the pattern from formatMaybeBytes)
    if (/^[A-Za-z0-9+/=_-]+$/.test(obj) && obj.length > 16) {
      const hex = base64ToHex(obj);
      if (hex) {
        return `0x${hex}`;
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBase64ToHex);
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertBase64ToHex(value);
    }
    return result;
  }

  return obj;
}

/**
 * Truncates text in the middle, showing the beginning and end with ellipsis.
 * Useful for displaying long IDs or addresses.
 * @param text - The text to truncate
 * @param maxLength - Maximum length of the truncated text (default: 30)
 * @returns Truncated text with ellipsis in the middle
 */
export function truncateMiddle(text: string, maxLength: number = 30): string {
  if (text.length <= maxLength) return text;
  const start = Math.floor(maxLength / 2) - 2;
  const end = text.length - (Math.floor(maxLength / 2) - 2);
  return `${text.slice(0, start)}....${text.slice(end)}`;
}

/** Lowercase hex without a 0x prefix, as the API serves addresses and filters. */
export function normalizeHex(value: string): string {
  const trimmed = value.trim();
  return (trimmed.startsWith("0x") || trimmed.startsWith("0X") ? trimmed.slice(2) : trimmed).toLowerCase();
}

/** Whether the value is a 32-byte hex address (with or without 0x). */
export function isHex32(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(normalizeHex(value));
}

/** First 8 and last 6 hex digits of a long hex value. */
export function truncateHex(value: string): string {
  if (!value) return "–";
  const prefix = value.startsWith("0x") ? "0x" : "";
  const digits = prefix ? value.slice(2) : value;
  if (digits.length <= 16) return value;
  return `${prefix}${digits.slice(0, 8)}…${digits.slice(-6)}`;
}

/** A decimal QUIL string from the API, grouped, with at most `decimals` places. */
export function formatQuil(value: string | undefined | null, decimals = 4): string {
  if (!value) return "–";
  const [whole, fraction = ""] = value.split(".");
  let grouped: string;
  try {
    grouped = BigInt(whole || "0").toLocaleString();
  } catch {
    return value;
  }
  const shown = fraction.slice(0, decimals).replace(/0+$/, "");
  return shown ? `${grouped}.${shown}` : grouped;
}

/** Wall-clock length of `frames` frames at the median interval, e.g. "≈ 40 min". */
export function formatFrameSpan(frames: number, medianIntervalMs: number | null | undefined): string | null {
  if (!medianIntervalMs || medianIntervalMs <= 0) return null;
  const minutes = (frames * medianIntervalMs) / 60_000;
  if (minutes < 1) return `≈ ${Math.round(minutes * 60)} s`;
  if (minutes < 120) return `≈ ${Math.round(minutes)} min`;
  return `≈ ${(minutes / 60).toFixed(1)} h`;
}
