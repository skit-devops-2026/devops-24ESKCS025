import express from "express";
import mongoose from "mongoose";
import Record from "../models/Record.js";
import { isDbConnected } from "../config/db.js";

const router = express.Router();

// Middleware to check database connectivity
const checkDbConnection = (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message:
        "MongoDB is not currently connected. Please configure your MONGODB_URI in backend/.env (e.g. MongoDB Atlas cluster string or local mongod service).",
    });
  }
  next();
};

/**
 * @route   GET /api/records
 * @desc    Get all records (with optional filter by category or status)
 */
router.get("/", checkDbConnection, async (req, res, next) => {
  try {
    const { category, status, block } = req.query;
    const filter = {};

    if (category && category !== "all") filter.category = category;
    if (status && status !== "all") filter.status = status;
    if (block && block !== "all") filter.hostelBlock = block;

    const records = await Record.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/records/:id
 * @desc    Get single record by MongoDB ObjectId
 */
router.get("/:id", checkDbConnection, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid record ID format: "${id}". Must be a 24-character hex string.`,
      });
    }

    const record = await Record.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Record not found with id: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/records
 * @desc    Create a new record in MongoDB
 */
router.post("/", checkDbConnection, async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      hostelBlock,
      roomNumber,
      studentName,
      status,
      priority,
      assignedTo,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide both 'title' and 'description' fields.",
      });
    }

    const newRecord = await Record.create({
      title: title.trim(),
      description: description.trim(),
      category: category || "other",
      hostelBlock: hostelBlock || "Block A",
      roomNumber: roomNumber ? roomNumber.trim() : "101",
      studentName: studentName ? studentName.trim() : "Resident Student",
      status: status || "pending",
      priority: priority || "medium",
      assignedTo: assignedTo ? assignedTo.trim() : "Unassigned",
    });

    res.status(201).json({
      success: true,
      message: "Record created successfully in MongoDB",
      data: newRecord,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/records/:id
 * @desc    Update an existing record
 */
router.put("/:id", checkDbConnection, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid record ID format: "${id}".`,
      });
    }

    const updatedRecord = await Record.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: `Record not found with id: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Record updated successfully in MongoDB",
      data: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/records/:id
 * @desc    Delete a record from MongoDB
 */
router.delete("/:id", checkDbConnection, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid record ID format: "${id}".`,
      });
    }

    const deletedRecord = await Record.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: `Record not found with id: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Record deleted successfully from MongoDB",
      data: { id },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
