import { describe, expect, it } from "vitest";
import { passcodeMatches } from "@/lib/passcode-security";

describe("shared app passcode", () => {
  it("accepts the passcode chosen for this app", () => {
    expect(passcodeMatches("12345678910hash", "12345678910hash")).toBe(true);
  });

  it("rejects a different passcode", () => {
    expect(passcodeMatches("12345678910hash ", "12345678910hash")).toBe(false);
  });
});