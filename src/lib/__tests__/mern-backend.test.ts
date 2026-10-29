import { describe, it, expect } from "vitest";
import Record from "../../../backend/models/Record.js";

describe("MERN Stack - Mongoose Record Model", () => {
  it("validates required title and description", async () => {
    const record = new Record({});
    let error: any = null;
    try {
      await record.validate();
    } catch (err) {
      error = err;
    }

    expect(error?.errors["title"]).toBeDefined();
    expect(error?.errors["description"]).toBeDefined();
  });

  it("applies default values for category, block, room, and status", () => {
    const record = new Record({
      title: "Broken window handle",
      description: "Window handle fell off during heavy wind",
    });

    expect(record.category).toBe("other");
    expect(record.hostelBlock).toBe("Block A");
    expect(record.roomNumber).toBe("101");
    expect(record.studentName).toBe("Resident Student");
    expect(record.status).toBe("pending");
    expect(record.priority).toBe("medium");
  });

  it("accepts valid category enums", async () => {
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
      const record = new Record({
        title: "Test Complaint",
        description: "Test Description for Category",
        category: cat,
      });
      let error: any = null;
      try {
        await record.validate();
      } catch (err) {
        error = err;
      }
      expect(error?.errors?.["category"]).toBeUndefined();
    }
  });

  it("rejects invalid category enum values", async () => {
    const record = new Record({
      title: "Test Complaint",
      description: "Test Description for Category",
      category: "unsupported_category_name",
    });
    let error: any = null;
    try {
      await record.validate();
    } catch (err) {
      error = err;
    }
    expect(error?.errors["category"]).toBeDefined();
  });

  it("validates minimum length on title and description", async () => {
    const record = new Record({
      title: "ab", // min 3
      description: "123", // min 5
    });
    let error: any = null;
    try {
      await record.validate();
    } catch (err) {
      error = err;
    }
    expect(error?.errors["title"]).toBeDefined();
    expect(error?.errors["description"]).toBeDefined();
  });
});
