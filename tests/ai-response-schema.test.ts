import { describe, it, expect } from "vitest";
import { suggestionResponseSchema } from "@/lib/ai";

describe("suggestionResponseSchema", () => {
  it("accepts a well-formed suggestion response", () => {
    const validResponse = {
      lowStock: [
        { itemId: "item-coke", name: "Coke 1.5L", reason: "Steady sales, none in 2 days." },
      ],
      deadStock: [
        { itemId: "item-sprite", name: "Sprite 1.5L", reason: "No sales in 10 days." },
      ],
      summary: "Bumili ka ng Coke, huwag muna ng Sprite.",
    };

    const result = suggestionResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it("accepts empty lowStock/deadStock arrays when nothing needs flagging", () => {
    const validResponse = {
      lowStock: [],
      deadStock: [],
      summary: "Walang kailangang bilhin ngayong linggo.",
    };

    const result = suggestionResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it("rejects a response missing the required summary field", () => {
    const malformedResponse = {
      lowStock: [],
      deadStock: [],
      // summary is missing — simulates the model dropping a required field
    };

    const result = suggestionResponseSchema.safeParse(malformedResponse);
    expect(result.success).toBe(false);
  });

  it("rejects a lowStock entry missing a required field", () => {
    const malformedResponse = {
      lowStock: [{ itemId: "item-coke", name: "Coke 1.5L" /* reason missing */ }],
      deadStock: [],
      summary: "Test",
    };

    const result = suggestionResponseSchema.safeParse(malformedResponse);
    expect(result.success).toBe(false);
  });

  it("rejects a response where lowStock is not an array", () => {
    const malformedResponse = {
      lowStock: "Coke 1.5L is low", // wrong type — simulates a hallucinated shape
      deadStock: [],
      summary: "Test",
    };

    const result = suggestionResponseSchema.safeParse(malformedResponse);
    expect(result.success).toBe(false);
  });
});
