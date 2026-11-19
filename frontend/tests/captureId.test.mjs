import test from "node:test";
import assert from "node:assert/strict";
import { createCaptureId } from "../lib/captureId.ts";

test("captures can receive an id without browser crypto APIs", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  try {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: undefined,
    });
    assert.match(createCaptureId(), /^capture-[a-z0-9]+-[a-z0-9]+$/);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "crypto", descriptor);
    else delete globalThis.crypto;
  }
});

test("rapid captures stay unique even when the clock repeats or moves backwards", (context) => {
  const clock = context.mock.method(Date, "now", () => 1_800_000_000_000);
  const ids = Array.from({ length: 1000 }, () => createCaptureId());
  clock.mock.mockImplementation(() => 1_799_999_999_000);
  ids.push(...Array.from({ length: 1000 }, () => createCaptureId()));
  assert.equal(new Set(ids).size, ids.length);
});
