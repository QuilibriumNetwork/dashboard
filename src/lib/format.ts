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
