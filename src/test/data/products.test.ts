import { describe, it, expect } from "vitest";
import { products, getProductBySlug } from "@/data/products";

describe("products data", () => {
  it("exports a non-empty products array", () => {
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  it("every product has required string fields", () => {
    for (const product of products) {
      expect(typeof product.slug).toBe("string");
      expect(product.slug.length).toBeGreaterThan(0);
      expect(typeof product.title).toBe("string");
      expect(product.title.length).toBeGreaterThan(0);
      expect(typeof product.description).toBe("string");
      expect(typeof product.tag).toBe("string");
      expect(typeof product.price).toBe("string");
      expect(typeof product.image).toBe("string");
      expect(typeof product.overview).toBe("string");
      expect(typeof product.shortNote).toBe("string");
      expect(typeof product.fullDescription).toBe("string");
    }
  });

  it("every product has a numeric cartLimit greater than zero", () => {
    for (const product of products) {
      expect(typeof product.cartLimit).toBe("number");
      expect(product.cartLimit).toBeGreaterThan(0);
    }
  });

  it("every product has a screenshots array with at least one entry", () => {
    for (const product of products) {
      expect(Array.isArray(product.screenshots)).toBe(true);
      expect(product.screenshots.length).toBeGreaterThan(0);
    }
  });

  it("every product has a features array with at least one entry", () => {
    for (const product of products) {
      expect(Array.isArray(product.features)).toBe(true);
      expect(product.features.length).toBeGreaterThan(0);
    }
  });

  it("all product slugs are unique", () => {
    const slugs = products.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("all product prices are formatted with ₹ prefix", () => {
    for (const product of products) {
      expect(product.price.startsWith("₹")).toBe(true);
    }
  });
});

describe("getProductBySlug", () => {
  it("returns the correct product for a known slug", () => {
    const firstProduct = products[0];
    const result = getProductBySlug(firstProduct.slug);
    expect(result).toBeDefined();
    expect(result?.slug).toBe(firstProduct.slug);
    expect(result?.title).toBe(firstProduct.title);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProductBySlug("non-existent-slug")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(getProductBySlug("")).toBeUndefined();
  });

  it("returns each product correctly by its own slug", () => {
    for (const product of products) {
      const found = getProductBySlug(product.slug);
      expect(found).toBe(product);
    }
  });
});
