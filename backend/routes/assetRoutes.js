import express from "express";
import mongoose from "mongoose";
import Asset from "../models/Asset.js";
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
 * @route   GET /api/assets/summary
 * @desc    Get aggregated inventory summary and KPI statistics
 */
router.get("/summary", checkDbConnection, async (req, res, next) => {
  try {
    const assets = await Asset.find({});

    let totalQuantity = 0;
    let lowStockCount = 0;
    let totalValuation = 0;
    const byCategory = {};

    assets.forEach((asset) => {
      totalQuantity += asset.quantity || 0;
      totalValuation += (asset.quantity || 0) * (asset.unitCost || 0);

      if (asset.quantity <= asset.minThreshold) {
        lowStockCount += 1;
      }

      byCategory[asset.category] = (byCategory[asset.category] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        totalDistinct: assets.length,
        totalQuantity,
        lowStockCount,
        totalValuation,
        byCategory,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/assets
 * @desc    Get all assets with optional filtering, search, and sorting
 */
router.get("/", checkDbConnection, async (req, res, next) => {
  try {
    const { category, block, condition, lowStock, search } = req.query;
    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }
    if (block && block !== "all") {
      filter.hostelBlock = block;
    }
    if (condition && condition !== "all") {
      filter.condition = condition;
    }
    if (lowStock === "true") {
      filter.$expr = { $lte: ["$quantity", "$minThreshold"] };
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { location: regex }, { supplier: regex }];
    }

    const assets = await Asset.find(filter).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/assets/:id
 * @desc    Get single asset by ID
 */
router.get("/:id", checkDbConnection, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid asset ID format: "${id}". Must be a 24-character hex string.`,
      });
    }

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: `Asset not found with id: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/assets
 * @desc    Create a new inventory asset
 */
router.post("/", checkDbConnection, async (req, res, next) => {
  try {
    const {
      name,
      category,
      hostelBlock,
      location,
      quantity,
      minThreshold,
      unit,
      condition,
      unitCost,
      supplier,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Asset name is required.",
      });
    }

    const numQty = quantity !== undefined ? Number(quantity) : 0;
    const numThreshold = minThreshold !== undefined ? Number(minThreshold) : 5;
    const numCost = unitCost !== undefined ? Number(unitCost) : 0;

    let initialCondition = condition || "good";
    if (numQty === 0 && initialCondition !== "needs_repair") {
      initialCondition = "depleted";
    }

    const newAsset = await Asset.create({
      name: name.trim(),
      category: category || "other",
      hostelBlock: hostelBlock || "Central Store",
      location: location ? location.trim() : "Main Inventory Room",
      quantity: Math.max(0, numQty),
      minThreshold: Math.max(0, numThreshold),
      unit: unit ? unit.trim() : "units",
      condition: initialCondition,
      unitCost: Math.max(0, numCost),
      supplier: supplier ? supplier.trim() : "Campus Procurement",
      notes: notes ? notes.trim() : "",
      lastRestocked: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Asset created successfully in MongoDB",
      data: newAsset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/assets/:id
 * @desc    Update an existing asset
 */
router.put("/:id", checkDbConnection, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid asset ID format: "${id}".`,
      });
    }

    const updates = { ...req.body };
    if (updates.quantity !== undefined) {
      updates.quantity = Math.max(0, Number(updates.quantity));
      if (updates.quantity === 0 && updates.condition !== "needs_repair") {
        updates.condition = "depleted";
      } else if (updates.quantity > 0 && updates.condition === "depleted") {
        updates.condition = "good";
      }
    }

    const updatedAsset = await Asset.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedAsset) {
      return res.status(404).json({
        success: false,
        message: `Asset not found with id: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset updated successfully in MongoDB",
      data: updatedAsset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /api/assets/:id/stock
 * @desc    Quick adjust stock count (+1 / -1 / custom change)
 */
router.patch("/:id/stock", checkDbConnection, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { change, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid asset ID format: "${id}".`,
      });
    }

    const numChange = Number(change);
    if (isNaN(numChange) || numChange === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid non-zero numerical 'change' value.",
      });
    }

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: `Asset not found with id: ${id}`,
      });
    }

    const newQuantity = Math.max(0, (asset.quantity || 0) + numChange);
    asset.quantity = newQuantity;

    if (numChange > 0) {
      asset.lastRestocked = new Date();
      if (asset.condition === "depleted") {
        asset.condition = "good";
      }
    } else if (newQuantity === 0 && asset.condition !== "needs_repair") {
      asset.condition = "depleted";
    }

    if (notes && notes.trim()) {
      asset.notes = `${asset.notes ? asset.notes + "\n" : ""}[${new Date().toLocaleDateString()}] Stock adjusted by ${numChange > 0 ? "+" : ""}${numChange}: ${notes.trim()}`;
    }

    await asset.save();

    res.status(200).json({
      success: true,
      message: `Stock updated successfully (${numChange > 0 ? "+" : ""}${numChange}). New quantity: ${newQuantity}`,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/assets/:id
 * @desc    Delete an asset from inventory
 */
router.delete("/:id", checkDbConnection, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid asset ID format: "${id}".`,
      });
    }

    const deletedAsset = await Asset.findByIdAndDelete(id);

    if (!deletedAsset) {
      return res.status(404).json({
        success: false,
        message: `Asset not found with id: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Asset deleted successfully from MongoDB",
      data: { id },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

