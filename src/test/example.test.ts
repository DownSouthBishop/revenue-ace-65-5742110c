import { describe, it, expect } from "vitest";

describe("template variable interpolation", () => {
  function tplVars(t: string, v: Record<string, string>) {
    return Object.entries(v).reduce(
      (a, [k, val]) => a.replace(new RegExp(`{${k}}`, "g"), val ?? ""),
      t
    );
  }

  it("replaces known placeholders", () => {
    const result = tplVars("Hi, I'm {business_name}. Book at {booking_link}.", {
      business_name: "Acme Plumbing",
      booking_link: "https://acme.com/book",
    });
    expect(result).toBe("Hi, I'm Acme Plumbing. Book at https://acme.com/book.");
  });

  it("leaves unknown placeholders untouched", () => {
    const result = tplVars("Hello {name}, from {business_name}.", {
      business_name: "Acme",
    });
    expect(result).toBe("Hello {name}, from Acme.");
  });

  it("replaces all occurrences", () => {
    const result = tplVars("{business_name} — {business_name}", {
      business_name: "Acme",
    });
    expect(result).toBe("Acme — Acme");
  });
});

describe("blackout window logic", () => {
  function inBlackout(start: number, end: number, h: number) {
    if (start === end) return false;
    return start > end ? h >= start || h < end : h >= start && h < end;
  }

  it("blocks during overnight blackout (22–7)", () => {
    expect(inBlackout(22, 7, 23)).toBe(true);
    expect(inBlackout(22, 7, 0)).toBe(true);
    expect(inBlackout(22, 7, 6)).toBe(true);
  });

  it("allows during daytime outside overnight blackout", () => {
    expect(inBlackout(22, 7, 8)).toBe(false);
    expect(inBlackout(22, 7, 12)).toBe(false);
    expect(inBlackout(22, 7, 21)).toBe(false);
  });

  it("blocks during same-day window (9–17)", () => {
    expect(inBlackout(9, 17, 10)).toBe(true);
    expect(inBlackout(9, 17, 9)).toBe(true);
  });

  it("allows outside same-day window", () => {
    expect(inBlackout(9, 17, 8)).toBe(false);
    expect(inBlackout(9, 17, 17)).toBe(false);
  });

  it("never blocks when start equals end", () => {
    expect(inBlackout(9, 9, 9)).toBe(false);
  });
});
