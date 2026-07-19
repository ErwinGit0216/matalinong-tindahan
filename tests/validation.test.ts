import { describe, it, expect } from "vitest";
import { validateSalesLogInput } from "@/lib/validation";

describe("validateSalesLogInput", () => {
  it("accepts a valid payload with itemId and quantity only", () => {
    const result = validateSalesLogInput({
      itemId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid payload including an optional past loggedAt date", () => {
    const result = validateSalesLogInput({
      itemId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 1,
      loggedAt: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing itemId", () => {
    const result = validateSalesLogInput({ quantity: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects an itemId that is not a valid UUID", () => {
    const result = validateSalesLogInput({ itemId: "not-a-uuid", quantity: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative quantity", () => {
    const zero = validateSalesLogInput({
      itemId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 0,
    });
    const negative = validateSalesLogInput({
      itemId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: -3,
    });
    expect(zero.success).toBe(false);
    expect(negative.success).toBe(false);
  });

  it("rejects a non-integer quantity", () => {
    const result = validateSalesLogInput({
      itemId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a loggedAt date in the future", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const result = validateSalesLogInput({
      itemId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 1,
      loggedAt: futureDate.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });
});
