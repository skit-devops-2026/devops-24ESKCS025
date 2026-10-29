import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Record title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Record description is required"],
      trim: true,
      minlength: [5, "Description must be at least 5 characters"],
      maxlength: [1500, "Description cannot exceed 1500 characters"],
    },
    category: {
      type: String,
      required: true,
      enum: ["electrical", "plumbing", "internet", "furniture", "cleanliness", "water", "other"],
      default: "other",
    },
    hostelBlock: {
      type: String,
      trim: true,
      default: "Block A",
    },
    roomNumber: {
      type: String,
      trim: true,
      default: "101",
    },
    studentName: {
      type: String,
      trim: true,
      default: "Resident Student",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: {
      type: String,
      trim: true,
      default: "Unassigned",
    },
  },
  {
    timestamps: true,
  },
);

const Record = mongoose.model("Record", recordSchema);

export default Record;
