import { describe, it, expect } from "vitest";
import Asset from "../../../backend/models/Asset.js";

describe("MERN Stack - Mongoose Asset Model", () => {
  it("validates required name and rejects empty object", async () => {
    const asset = new Asset({});
    let error: any = null;
    try {
      await asset.validate();
    } catch (err) {
      error = err;
    }

    expect(error?.errors["name"]).toBeDefined();
  });

  it("applies sensible default values for quantity, thresholds, and condition", () => {
    const asset = new Asset({
      name: "Havells 1200mm Ceiling Fan",
    });

    expect(asset.category).toBe("other");
    expect(asset.hostelBlock).toBe("Central Store");
    expect(asset.location).toBe("Main Inventory Room");
    expect(asset.quantity).toBe(0);
    expect(asset.minThreshold).toBe(5);
    expect(asset.unit).toBe("units");
    expect(asset.condition).toBe("good");
    expect(asset.unitCost).toBe(0);
    expect(asset.supplier).toBe("Campus Procurement");
  });

  it("accepts all valid categories", async () => {
    const validCategories = [
      "electrical",
      "plumbing",
      "internet",
      "furniture",
      "cleanliness",
      "water",
      "other",
    ];

    for (const cat of validCategories) {
      const asset = new Asset({
        name: `Item for ${cat}`,
        category: cat,
      });
      let error: any = null;
      try {
        await asset.validate();
      } catch (err) {
        error = err;
      }
      expect(error?.errors?.["category"]).toBeUndefined();
    }
  });

  it("rejects invalid category enums", async () => {
    const asset = new Asset({
      name: "Invalid Category Item",
      category: "unsupported_category_name",
    });
    let error: any = null;
    try {
      await asset.validate();
    } catch (err) {
      error = err;
    }
    expect(error?.errors["category"]).toBeDefined();
  });

  it("accepts valid condition enums", async () => {
    const validConditions = ["new", "good", "needs_repair", "depleted"];

    for (const cond of validConditions) {
      const asset = new Asset({
        name: `Condition Test - ${cond}`,
        condition: cond,
      });
      let error: any = null;
      try {
        await asset.validate();
      } catch (err) {
        error = err;
      }
      expect(error?.errors?.["condition"]).toBeUndefined();
    }
  });

  it("rejects invalid condition enums", async () => {
    const asset = new Asset({
      name: "Invalid Condition Item",
      condition: "broken_beyond_repair",
    });
    let error: any = null;
    try {
      await asset.validate();
    } catch (err) {
      error = err;
    }
    expect(error?.errors["condition"]).toBeDefined();
  });

  it("rejects negative quantity or unitCost", async () => {
    const asset = new Asset({
      name: "Negative Value Test",
      quantity: -5,
      unitCost: -100,
    });
    let error: any = null;
    try {
      await asset.validate();
    } catch (err) {
      error = err;
    }
    expect(error?.errors["quantity"]).toBeDefined();
    expect(error?.errors["unitCost"]).toBeDefined();
  });

  it("correctly computes virtual properties isLowStock and totalValue", () => {
    const assetLow = new Asset({
      name: "LED Tubelight 20W",
      quantity: 3,
      minThreshold: 5,
      unitCost: 180,
    });

    expect(assetLow.isLowStock).toBe(true);
    expect(assetLow.totalValue).toBe(3 * 180);

    const assetHealthy = new Asset({
      name: "Brass Water Tap",
      quantity: 20,
      minThreshold: 5,
      unitCost: 350,
    });

    expect(assetHealthy.isLowStock).toBe(false);
    expect(assetHealthy.totalValue).toBe(20 * 350);
  });

  it("trims whitespace on name, block, and supplier", () => {
    const asset = new Asset({
      name: "   Havells Regulator   ",
      hostelBlock: "   Block B   ",
      supplier: "   Campus Supplies Ltd   ",
    });

    expect(asset.name).toBe("Havells Regulator");
    expect(asset.hostelBlock).toBe("Block B");
    expect(asset.supplier).toBe("Campus Supplies Ltd");
  });

  it("includes virtual properties when serialized to JSON", () => {
    const asset = new Asset({
      name: "Cat6 RJ45 Cable",
      quantity: 4,
      minThreshold: 10,
      unitCost: 25,
    });

    const json = asset.toJSON();
    expect(json.isLowStock).toBe(true);
    expect(json.totalValue).toBe(100);
  });
});

