let sequence = 0;

// Captures live in this tab's session; their IDs do not require secure-context APIs.
export function createCaptureId(): string {
  sequence += 1;
  return `capture-${Date.now().toString(36)}-${sequence.toString(36)}`;
}
