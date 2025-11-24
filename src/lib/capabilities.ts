/**
 * Capability labels mapping protocol identifiers to human-readable names
 */
export const capabilityLabels: Record<number, string> = {
  0x00010001: "Compute Protocol v1",
  0x00010101: "KZG Verify (BLS48581)",
  0x00010201: "Bulletproof Range Verify (Decaf448)",
  0x00010301: "Bulletproof Sum Verify (Decaf448)",
  0x00010401: "SECP256K1 ECDSA Verify",
  0x00010501: "ED25519 EdDSA Verify",
  0x00010601: "ED448 EdDSA Verify",
  0x00010701: "DECAF448 Schnorr Verify",
  0x00010801: "SECP256R1 ECDSA Verify",
  0x00020001: "Global Protocol v1",
  0x00030001: "Hypergraph Protocol v1",
  0x00040001: "Token Protocol v1",
  0x0101: "Double Ratchet v1",
  0x0201: "Triple Ratchet v1",
  0x0301: "Onion Routing v1",
};

/**
 * Get the human-readable label for a protocol identifier
 * @param protocolIdentifier The protocol identifier number
 * @returns The label if found, otherwise returns the identifier as a string
 */
export function getCapabilityLabel(protocolIdentifier: number): string {
  return capabilityLabels[protocolIdentifier] ?? `Unknown (${protocolIdentifier})`;
}

/**
 * Format a capability for display
 * @param protocolIdentifier The protocol identifier number
 * @param additionalMetadata Optional additional metadata
 * @returns A formatted string with the label and metadata
 */
export function formatCapability(protocolIdentifier: number, additionalMetadata?: string): string {
  const label = getCapabilityLabel(protocolIdentifier);
  if (additionalMetadata && additionalMetadata.trim()) {
    return `${label} (${additionalMetadata})`;
  }
  return label;
}

/**
 * Get all capability identifiers in order
 * @returns Array of all protocol identifiers
 */
export function getAllCapabilityIdentifiers(): number[] {
  return Object.keys(capabilityLabels).map(key => Number(key));
}

