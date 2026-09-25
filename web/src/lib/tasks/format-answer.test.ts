import { describe, expect, it } from "vitest";
import { formatAnswer } from "./format-answer";

describe("formatAnswer", () => {
  it("показывает ответ каждого типа", () => {
    expect(formatAnswer({ type: "number", value: 7 })).toBe("7");
    expect(formatAnswer({ type: "number", value: 2.5, tolerance: 0.01 })).toBe("2.5 (допуск ±0.01)");
    expect(formatAnswer({ type: "roots", values: [] })).toBe("корней нет");
    expect(formatAnswer({ type: "tuple", values: ["2", "1"] })).toBe("(2; 1)");
    expect(
      formatAnswer({ type: "quantity", value: 2, unit: "m/s**2", relativeTolerance: 0.07 }),
    ).toBe("2 m/s**2 (допуск ±7%)");
    expect(formatAnswer({ type: "digits", value: "24", ordered: false })).toBe(
      "24 (порядок не важен)",
    );
    expect(
      formatAnswer({ type: "steps", final: { type: "roots", values: ["2"] } }),
    ).toBe("итог: 2");
  });
});
