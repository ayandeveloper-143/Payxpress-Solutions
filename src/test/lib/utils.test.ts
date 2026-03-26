import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("returns a single class name unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class names with a space", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("returns empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });

  it("ignores falsy values like false and undefined", () => {
    expect(cn("foo", false && "bar", undefined, "baz")).toBe("foo baz");
  });

  it("ignores null values", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("deduplicates conflicting tailwind utility classes (last one wins)", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("merges conflicting text color classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles conditional object syntax", () => {
    expect(cn({ "font-bold": true, italic: false })).toBe("font-bold");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("preserves non-conflicting tailwind classes", () => {
    const result = cn("flex", "items-center", "text-red-500");
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).toContain("text-red-500");
  });
});
