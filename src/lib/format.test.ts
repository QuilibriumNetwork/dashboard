import { describe, it, expect } from "vitest";
import { base64ToIPFSCID, ipfsCIDToBase64 } from "./format";

describe("IPFS CID conversion", () => {
  it("should convert multihash base64 to Qm format CID", async () => {
    // Known test case: multihash base64 -> Qm CID
    // Input: EiAB8GYGS0bYBxwtxHRjfk1+NjCjo0qCe8zgKcvrwpGYkw==
    // Expected output: QmNUDj7bwW2zVCdJoS4RB41P8786rsViRRAqoPTaX4yteN
    const multihashBase64 = "EiAB8GYGS0bYBxwtxHRjfk1+NjCjo0qCe8zgKcvrwpGYkw==";
    const expectedCID = "QmNUDj7bwW2zVCdJoS4RB41P8786rsViRRAqoPTaX4yteN";

    const result = await base64ToIPFSCID(multihashBase64);
    expect(result).toBe(expectedCID);
  });

  it("should convert Qm format CID back to multihash base64", async () => {
    // Reverse test: Qm CID -> multihash base64
    // Input: QmNUDj7bwW2zVCdJoS4RB41P8786rsViRRAqoPTaX4yteN
    // Expected output: EiAB8GYGS0bYBxwtxHRjfk1+NjCjo0qCe8zgKcvrwpGYkw==
    const cid = "QmNUDj7bwW2zVCdJoS4RB41P8786rsViRRAqoPTaX4yteN";
    const expectedMultihashBase64 = "EiAB8GYGS0bYBxwtxHRjfk1+NjCjo0qCe8zgKcvrwpGYkw==";

    const result = await ipfsCIDToBase64(cid);
    expect(result).toBe(expectedMultihashBase64);
  });

  it("should handle hex input with 0x prefix", async () => {
    // Test that hex input with 0x prefix is handled correctly
    // First, let's get the hex from the multihash base64
    const multihashBase64 = "EiAB8GYGS0bYBxwtxHRjfk1+NjCjo0qCe8zgKcvrwpGYkw==";
    const binary = atob(multihashBase64);
    const hex = Array.from(binary)
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
    const hexWithPrefix = `0x${hex}`;

    // Convert hex (with 0x) to CID - should work the same as base64
    const result = await base64ToIPFSCID(hexWithPrefix);
    const expectedCID = "QmNUDj7bwW2zVCdJoS4RB41P8786rsViRRAqoPTaX4yteN";
    expect(result).toBe(expectedCID);
  });

  it("should handle hex input without 0x prefix", async () => {
    // Test hex input without 0x prefix
    const multihashBase64 = "EiAB8GYGS0bYBxwtxHRjfk1+NjCjo0qCe8zgKcvrwpGYkw==";
    const binary = atob(multihashBase64);
    const hex = Array.from(binary)
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");

    const result = await base64ToIPFSCID(hex);
    const expectedCID = "QmNUDj7bwW2zVCdJoS4RB41P8786rsViRRAqoPTaX4yteN";
    expect(result).toBe(expectedCID);
  });
});

