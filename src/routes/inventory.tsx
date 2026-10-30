import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Boxes,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  AlertTriangle,
  Server,
  Database,
  Search,
  Filter,
  Package,
  Layers,
  IndianRupee,
  MinusCircle,
  PlusCircle,
  Building,
  MapPin,
  Truck,
  CheckCircle2,
  X,
  Lock,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  inventoryApi,
  type HostelAsset,
  type AssetSummary,
  type CreateAssetInput,
} from "@/lib/inventory-api";
import { CATEGORIES, CATEGORY_MAP, HOSTEL_BLOCKS } from "@/lib/complaints";
import { useAuth } from "@/lib/auth";
import { PageShell, PageHeading, Loader, EmptyState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Asset & Inventory Management — HostelFix" },
      {
        name: "description",
        content:
          "Manage hostel maintenance equipment, electrical spares, plumbing fixtures, and supplies using the MERN stack.",
      },
    ],
  }),
  component: InventoryPage,
});

const INVENTORY_BLOCKS = [...HOSTEL_BLOCKS, "Central Store", "Maintenance Workshop"];

const CONDITION_COLORS: Record<string, string> = {
  new: "bg-success/15 text-success border-success/30",
  good: "bg-info/15 text-info border-info/30",
  needs_repair: "bg-warning/15 text-warning border-warning/30",
  depleted: "bg-destructive/15 text-destructive border-destructive/30",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Brand New",
  good: "Good / Ready",
  needs_repair: "Needs Servicing",
  depleted: "Out of Stock",
};

function InventoryPage() {
  const { user, profile, isAdmin } = useAuth();
  const [assets, setAssets] = useState<HostelAsset[]>([]);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [serverHealth, setServerHealth] = useState<{
    online: boolean;
    mongodb: "connected" | "disconnected";
  }>({ online: false, mongodb: "disconnected" });

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBlock, setFilterBlock] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<HostelAsset | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateAssetInput>({
    name: "",
    category: "electrical",
    hostelBlock: "Central Store",
    location: "Main Store Room",
    quantity: 10,
    minThreshold: 5,
    unit: "units",
    condition: "good",
    unitCost: 150,
    supplier: "Campus Procurement",
    notes: "",
  });

  const checkHealth = async () => {
    const health = await inventoryApi.checkHealth();
    setServerHealth(health);
    return health;
  };

  const fetchAssetsAndSummary = async (manual = false) => {
    setLoading(true);
    try {
      const health = await checkHealth();
      if (!health.online) {
        setAssets([]);
        setSummary(null);
        if (manual) toast.info("Express backend is currently offline on port 5000");
        return;
      }

      const [assetList, summaryData] = await Promise.all([
        inventoryApi.getAssets({
          category: filterCategory,
          block: filterBlock,
          condition: filterCondition,
          lowStock: filterLowStock,
          search: search,
        }),
        inventoryApi.getAssetSummary().catch(() => null),
      ]);

      setAssets(assetList);
      if (summaryData) setSummary(summaryData);
      if (manual) toast.success("Inventory refreshed successfully");
    } catch (err: any) {
      if (manual) toast.error(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetsAndSummary();
  }, [filterCategory, filterBlock, filterCondition, filterLowStock, search]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in as Head Warden to add inventory assets");
      return;
    }
    if (!isAdmin) {
      toast.error("Access denied: Only the Head Warden can add inventory assets");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Please enter an asset name");
      return;
    }

    setActionLoading(true);
    try {
      const created = await inventoryApi.createAsset(formData);
      toast.success(`Asset "${created.name}" created in MongoDB!`);
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        category: "electrical",
        hostelBlock: "Central Store",
        location: "Main Store Room",
        quantity: 10,
        minThreshold: 5,
        unit: "units",
        condition: "good",
        unitCost: 150,
        supplier: "Campus Procurement",
        notes: "",
      });
      fetchAssetsAndSummary();
    } catch (err: any) {
      toast.error(err.message || "Failed to create asset in MongoDB");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in as Head Warden to update inventory");
      return;
    }
    if (!isAdmin) {
      toast.error("Access denied: Only the Head Warden can update inventory assets");
      return;
    }
    if (!editingAsset) return;

    setActionLoading(true);
    try {
      await inventoryApi.updateAsset(editingAsset._id, formData);
      toast.success(`Asset "${editingAsset.name}" updated successfully!`);
      setEditingAsset(null);
      fetchAssetsAndSummary();
    } catch (err: any) {
      toast.error(err.message || "Failed to update asset");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickStock = async (asset: HostelAsset, change: number) => {
    if (!user) {
      toast.error("Please sign in as Head Warden to adjust stock");
      return;
    }
    if (!isAdmin) {
      toast.error("Access denied: Only the Head Warden can modify stock levels");
      return;
    }

    try {
      const updated = await inventoryApi.adjustStock(
        asset._id,
        change,
        change < 0 ? "Issued for maintenance repair" : "Restocked item",
      );
      toast.success(
        `${change > 0 ? "Restocked +1" : "Issued -1"} (${asset.name}). Stock: ${updated.quantity}`,
      );
      setAssets((prev) => prev.map((a) => (a._id === asset._id ? updated : a)));
      // Also refresh summary
      inventoryApi.getAssetSummary().then((s) => setSummary(s)).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || "Could not update stock");
    }
  };

  const handleDeleteAsset = async (asset: HostelAsset) => {
    if (!user) {
      toast.error("Please sign in as Head Warden to delete inventory assets");
      return;
    }
    if (!isAdmin) {
      toast.error("Access denied: Only the Head Warden can delete inventory assets");
      return;
    }

    if (!confirm(`Are you sure you want to delete asset "${asset.name}" from MongoDB?`)) {
      return;
    }

    try {
      await inventoryApi.deleteAsset(asset._id);
      toast.success(`Asset "${asset.name}" deleted from MongoDB`);
      setAssets((prev) => prev.filter((a) => a._id !== asset._id));
      inventoryApi.getAssetSummary().then((s) => setSummary(s)).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || "Failed to delete asset");
    }
  };

  const openEditModal = (asset: HostelAsset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      category: asset.category,
      hostelBlock: asset.hostelBlock,
      location: asset.location,
      quantity: asset.quantity,
      minThreshold: asset.minThreshold,
      unit: asset.unit,
      condition: asset.condition,
      unitCost: asset.unitCost,
      supplier: asset.supplier,
      notes: asset.notes || "",
    });
  };

  return (
    <PageShell>
      <PageHeading
        title="Asset & Inventory Management"
        subtitle="Live MERN tracker for hostel maintenance equipment, electrical spares, and plumbing inventory."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAssetsAndSummary(true)}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {user && isAdmin ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditingAsset(null);
                  setFormData({
                    name: "",
                    category: "electrical",
                    hostelBlock: "Central Store",
                    location: "Main Store Room",
                    quantity: 10,
                    minThreshold: 5,
                    unit: "units",
                    condition: "good",
                    unitCost: 150,
                    supplier: "Campus Procurement",
                    notes: "",
                  });
                  setCreateDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="size-4" />
                Add Asset
              </Button>
            ) : !user ? (
              <Button asChild size="sm" className="gap-2">
                <Link to="/auth">
                  <Lock className="size-4" /> Sign In
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Role Access Level Notice */}
      {!user ? (
        <div className="mb-6 rounded-2xl border border-border/80 bg-secondary/50 p-3.5 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Lock className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Guest Read-Only Inventory Directory</p>
              <p className="text-muted-foreground text-[11px]">
                You can browse available spares and equipment. Only the Head Warden can register new
                assets or modify stock levels.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <Link to="/auth">
              <ShieldCheck className="size-3.5" /> Sign In as Head Warden
            </Link>
          </Button>
        </div>
      ) : !isAdmin ? (
        <div className="mb-6 rounded-2xl border border-info/30 bg-info/10 p-3.5 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-info/15 text-info">
              <ShieldAlert className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-info">Resident Student Portal (Read-Only Inventory)</p>
              <p className="text-muted-foreground text-[11px]">
                Logged in as <strong>{profile?.name || user.email}</strong>. Asset inventory and
                spare parts are managed exclusively by the Head Warden.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <Link to="/complaints/new">
              <Plus className="size-3.5" /> Report Broken Fixture
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span className="font-semibold text-primary">Head Warden Console</span>
            <span className="text-muted-foreground">
              • Full authorization to add new assets, issue parts, restock, and edit items
            </span>
          </div>
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
            👑 HEAD WARDEN
          </span>
        </div>
      )}

      {/* Backend & MongoDB Status Indicators */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="glass flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-10 place-items-center rounded-xl ${
                serverHealth.online
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              <Server className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Express Backend (Node.js)
              </p>
              <p className="text-sm font-semibold">
                {serverHealth.online ? "Online (Port 5000)" : "Offline / Unreachable"}
              </p>
            </div>
          </div>
          <span
            className={`size-2.5 rounded-full ${
              serverHealth.online ? "bg-success animate-pulse" : "bg-destructive"
            }`}
          />
        </div>

        <div className="glass flex items-center justify-between rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-10 place-items-center rounded-xl ${
                serverHealth.mongodb === "connected"
                  ? "bg-success/15 text-success"
                  : "bg-warning/15 text-warning"
              }`}
            >
              <Database className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                MongoDB Database (Mongoose)
              </p>
              <p className="text-sm font-semibold">
                {serverHealth.mongodb === "connected" ? "Connected" : "Not Connected"}
              </p>
            </div>
          </div>
          <span
            className={`size-2.5 rounded-full ${
              serverHealth.mongodb === "connected" ? "bg-success" : "bg-warning"
            }`}
          />
        </div>
      </div>

      {/* Offline Alert */}
      {!serverHealth.online && (
        <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning">
                MERN Backend server is not running on port 5000
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start the backend server in a PowerShell terminal to enable live MongoDB CRUD operations:
              </p>
              <code className="mt-2 block rounded bg-background/80 px-3 py-1.5 font-mono text-xs text-foreground">
                npm run server
              </code>
            </div>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Distinct Items</span>
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Boxes className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-display">
            {summary ? summary.totalDistinct : assets.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Catalogued asset models</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total In Stock</span>
            <span className="grid size-8 place-items-center rounded-lg bg-info/10 text-info">
              <Layers className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-display">
            {summary ? summary.totalQuantity : assets.reduce((acc, a) => acc + (a.quantity || 0), 0)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total available units</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Low Stock Alerts</span>
            <span
              className={`grid size-8 place-items-center rounded-lg ${
                (summary?.lowStockCount || 0) > 0
                  ? "bg-destructive/15 text-destructive animate-pulse"
                  : "bg-success/10 text-success"
              }`}
            >
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-display text-destructive">
            {summary
              ? summary.lowStockCount
              : assets.filter((a) => (a.quantity || 0) <= (a.minThreshold || 5)).length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Below buffer threshold</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Valuation</span>
            <span className="grid size-8 place-items-center rounded-lg bg-success/10 text-success">
              <IndianRupee className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold font-display text-success">
            ₹
            {summary
              ? summary.totalValuation.toLocaleString("en-IN")
              : assets
                  .reduce((acc, a) => acc + (a.quantity || 0) * (a.unitCost || 0), 0)
                  .toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Estimated inventory value</p>
        </motion.div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets, supplier, location..."
            className="h-9 pl-9 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Categories
              </SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Block Filter */}
          <Select value={filterBlock} onValueChange={setFilterBlock}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="All Blocks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Blocks
              </SelectItem>
              {INVENTORY_BLOCKS.map((b) => (
                <SelectItem key={b} value={b} className="text-xs">
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Condition Filter */}
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="All Conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Conditions
              </SelectItem>
              <SelectItem value="new" className="text-xs">
                Brand New
              </SelectItem>
              <SelectItem value="good" className="text-xs">
                Good / Ready
              </SelectItem>
              <SelectItem value="needs_repair" className="text-xs">
                Needs Repair
              </SelectItem>
              <SelectItem value="depleted" className="text-xs">
                Out of Stock
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Low Stock Toggle */}
          <Button
            variant={filterLowStock ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilterLowStock(!filterLowStock)}
            className="h-9 gap-1.5 text-xs"
          >
            <AlertTriangle className="size-3.5" />
            Low Stock Only
          </Button>
        </div>
      </div>

      {/* Asset Cards Grid */}
      {loading ? (
        <Loader label="Loading assets from MongoDB..." />
      ) : assets.length === 0 ? (
        <EmptyState
          title="No inventory assets found"
          description={
            serverHealth.online
              ? "No items match your filter criteria. Click 'Add Asset' to register a new maintenance item."
              : "Start the backend server with 'npm run server' to load MongoDB inventory records."
          }
          action={
            serverHealth.online && user && isAdmin ? (
              <Button
                onClick={() => {
                  setEditingAsset(null);
                  setCreateDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="size-4" /> Add First Asset
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const isLowStock = asset.quantity <= asset.minThreshold;
            const CategoryIcon = CATEGORY_MAP[asset.category]?.icon || Package;

            return (
              <motion.div
                key={asset._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass group relative flex flex-col justify-between rounded-2xl p-5 transition-shadow hover:shadow-lg"
              >
                <div>
                  {/* Top Tags & Condition */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground capitalize">
                      <CategoryIcon className="size-3.5 text-primary" />
                      {asset.category}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                        CONDITION_COLORS[asset.condition] || "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {CONDITION_LABELS[asset.condition] || asset.condition}
                    </span>
                  </div>

                  {/* Asset Name & Low Stock Alert */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-foreground">
                      {asset.name}
                    </h3>
                    {isLowStock && (
                      <span
                        title={`Stock is at or below threshold (${asset.minThreshold})`}
                        className="inline-flex items-center gap-1 shrink-0 rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive border border-destructive/30"
                      >
                        <AlertTriangle className="size-3" />
                        LOW STOCK
                      </span>
                    )}
                  </div>

                  {/* Location & Block */}
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building className="size-3.5 shrink-0 text-primary" />
                      <span>{asset.hostelBlock}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{asset.location || "General storage"}</span>
                    </div>
                    {asset.supplier && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">Supplier: {asset.supplier}</span>
                      </div>
                    )}
                  </div>

                  {/* Stock Level Display */}
                  <div className="mt-4 rounded-xl bg-background/60 border border-border/50 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-muted-foreground">In Stock</span>
                      <span className="text-sm font-semibold">
                        <strong className="text-lg font-bold text-foreground">
                          {asset.quantity}
                        </strong>{" "}
                        <span className="text-xs text-muted-foreground">{asset.unit}</span>
                      </span>
                    </div>

                    {/* Visual Progress bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLowStock ? "bg-destructive" : "bg-success"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            asset.minThreshold > 0
                              ? (asset.quantity / (asset.minThreshold * 2)) * 100
                              : 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Min buffer: {asset.minThreshold} {asset.unit}</span>
                      <span>₹{asset.unitCost} / {asset.unit}</span>
                    </div>
                  </div>

                  {asset.notes && (
                    <p className="mt-3 text-xs text-muted-foreground italic line-clamp-2">
                      "{asset.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions: Head Warden only vs Read-only status for students/guests */}
                {user && isAdmin ? (
                  <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        title="Issue 1 unit for repair"
                        disabled={asset.quantity <= 0}
                        onClick={() => handleQuickStock(asset, -1)}
                        className="h-7 px-2 text-xs gap-1 hover:text-destructive"
                      >
                        <MinusCircle className="size-3.5" />
                        Issue 1
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Restock 1 unit"
                        onClick={() => handleQuickStock(asset, 1)}
                        className="h-7 px-2 text-xs gap-1 hover:text-success"
                      >
                        <PlusCircle className="size-3.5" />
                        Restock 1
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit asset details"
                        onClick={() => openEditModal(asset)}
                        className="size-7"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete asset from MongoDB"
                        onClick={() => handleDeleteAsset(asset)}
                        className="size-7 text-destructive hover:bg-destructive/15"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-primary" />
                      Authorized for Head Warden dispatch
                    </span>
                    <span className="font-mono text-[10px] opacity-70">
                      {asset.hostelBlock}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Asset Dialog */}
      <Dialog
        open={createDialogOpen || !!editingAsset}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditingAsset(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              {editingAsset ? `Edit Asset: ${editingAsset.name}` : "Add New Inventory Asset"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={editingAsset ? handleUpdateAsset : handleCreateAsset}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="asset-name" className="text-xs">
                Asset / Item Name *
              </Label>
              <Input
                id="asset-name"
                required
                placeholder="e.g. Havells 1200mm Ceiling Fan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(v: any) => setFormData({ ...formData, condition: v })}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new" className="text-xs">
                      Brand New
                    </SelectItem>
                    <SelectItem value="good" className="text-xs">
                      Good / Ready
                    </SelectItem>
                    <SelectItem value="needs_repair" className="text-xs">
                      Needs Servicing
                    </SelectItem>
                    <SelectItem value="depleted" className="text-xs">
                      Out of Stock
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Hostel Block *</Label>
                <Select
                  value={formData.hostelBlock}
                  onValueChange={(v) => setFormData({ ...formData, hostelBlock: v })}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Block" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVENTORY_BLOCKS.map((b) => (
                      <SelectItem key={b} value={b} className="text-xs">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="asset-loc" className="text-xs">
                  Storage Location
                </Label>
                <Input
                  id="asset-loc"
                  placeholder="e.g. Shelf B-2, Electrical Room"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="asset-qty" className="text-xs">
                  Quantity *
                </Label>
                <Input
                  id="asset-qty"
                  type="number"
                  min="0"
                  required
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="asset-thresh" className="text-xs">
                  Min Buffer *
                </Label>
                <Input
                  id="asset-thresh"
                  type="number"
                  min="0"
                  required
                  value={formData.minThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 0 })
                  }
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="asset-unit" className="text-xs">
                  Unit Name
                </Label>
                <Input
                  id="asset-unit"
                  placeholder="units, pieces, meters"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="asset-cost" className="text-xs">
                  Unit Cost (₹)
                </Label>
                <Input
                  id="asset-cost"
                  type="number"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) =>
                    setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })
                  }
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="asset-supplier" className="text-xs">
                  Supplier / Vendor
                </Label>
                <Input
                  id="asset-supplier"
                  placeholder="e.g. Havells / Local Hardware"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="asset-notes" className="text-xs">
                Notes / Technical Specifications
              </Label>
              <Textarea
                id="asset-notes"
                rows={2}
                placeholder="Model number, warranty period, or compatible hostel fixtures..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditingAsset(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={actionLoading}>
                {actionLoading
                  ? "Saving to MongoDB..."
                  : editingAsset
                  ? "Update Asset"
                  : "Create Asset in MongoDB"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

