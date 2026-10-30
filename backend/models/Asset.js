import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
      minlength: [2, "Asset name must be at least 2 characters"],
      maxlength: [100, "Asset name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["electrical", "plumbing", "internet", "furniture", "cleanliness", "water", "other"],
      default: "other",
    },
    hostelBlock: {
      type: String,
      required: [true, "Hostel block is required"],
      trim: true,
      default: "Central Store",
    },
    location: {
      type: String,
      trim: true,
      default: "Main Inventory Room",
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    minThreshold: {
      type: Number,
      required: [true, "Minimum threshold is required"],
      min: [0, "Threshold cannot be negative"],
      default: 5,
    },
    unit: {
      type: String,
      trim: true,
      default: "units",
      maxlength: [30, "Unit cannot exceed 30 characters"],
    },
    condition: {
      type: String,
      enum: ["new", "good", "needs_repair", "depleted"],
      default: "good",
    },
    unitCost: {
      type: Number,
      min: [0, "Unit cost cannot be negative"],
      default: 0,
    },
    supplier: {
      type: String,
      trim: true,
      default: "Campus Procurement",
      maxlength: [100, "Supplier name cannot exceed 100 characters"],
    },
    lastRestocked: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for low stock warning
assetSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.minThreshold;
});

// Virtual for total valuation (quantity * unitCost)
assetSchema.virtual("totalValue").get(function () {
  return (this.quantity || 0) * (this.unitCost || 0);
});

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;

