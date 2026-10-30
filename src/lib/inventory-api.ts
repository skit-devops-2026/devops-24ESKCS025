export type HostelAsset = {
  _id: string;
  name: string;
  category:
    | "electrical"
    | "plumbing"
    | "internet"
    | "furniture"
    | "cleanliness"
    | "water"
    | "other";
  hostelBlock: string;
  location: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  condition: "new" | "good" | "needs_repair" | "depleted";
  unitCost: number;
  supplier: string;
  lastRestocked: string;
  notes: string;
  isLowStock?: boolean;
  totalValue?: number;
  createdAt: string;
  updatedAt: string;
};

export type AssetSummary = {
  totalDistinct: number;
  totalQuantity: number;
  lowStockCount: number;
  totalValuation: number;
  byCategory: Record<string, number>;
};

export type CreateAssetInput = {
  name: string;
  category: string;
  hostelBlock?: string;
  location?: string;
  quantity?: number;
  minThreshold?: number;
  unit?: string;
  condition?: "new" | "good" | "needs_repair" | "depleted";
  unitCost?: number;
  supplier?: string;
  notes?: string;
};

const API_BASE = import.meta.env.VITE_MERN_API_URL || "http://localhost:5000/api";

export const inventoryApi = {
  async getAssets(params?: {
    category?: string;
    block?: string;
    condition?: string;
    lowStock?: boolean;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== "all") {
      searchParams.set("category", params.category);
    }
    if (params?.block && params.block !== "all") {
      searchParams.set("block", params.block);
    }
    if (params?.condition && params.condition !== "all") {
      searchParams.set("condition", params.condition);
    }
    if (params?.lowStock) {
      searchParams.set("lowStock", "true");
    }
    if (params?.search && params.search.trim()) {
      searchParams.set("search", params.search.trim());
    }

    const query = searchParams.toString();
    const url = `${API_BASE}/assets${query ? `?${query}` : ""}`;
    const res = await fetch(url);
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to fetch assets (${res.status})`);
    }

    return (result.data || []) as HostelAsset[];
  },

  async getAssetSummary(): Promise<AssetSummary> {
    const res = await fetch(`${API_BASE}/assets/summary`);
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to fetch summary (${res.status})`);
    }

    return result.data as AssetSummary;
  },

  async getAssetById(id: string) {
    const res = await fetch(`${API_BASE}/assets/${id}`);
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to fetch asset (${res.status})`);
    }

    return result.data as HostelAsset;
  },

  async createAsset(asset: CreateAssetInput) {
    const res = await fetch(`${API_BASE}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(asset),
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to create asset (${res.status})`);
    }

    return result.data as HostelAsset;
  },

  async updateAsset(id: string, updates: Partial<CreateAssetInput>) {
    const res = await fetch(`${API_BASE}/assets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to update asset (${res.status})`);
    }

    return result.data as HostelAsset;
  },

  async adjustStock(id: string, change: number, notes?: string) {
    const res = await fetch(`${API_BASE}/assets/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change, notes }),
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to adjust stock (${res.status})`);
    }

    return result.data as HostelAsset;
  },

  async deleteAsset(id: string) {
    const res = await fetch(`${API_BASE}/assets/${id}`, {
      method: "DELETE",
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to delete asset (${res.status})`);
    }

    return result.data;
  },

  async checkHealth(): Promise<{
    online: boolean;
    mongodb: "connected" | "disconnected";
  }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) return { online: false, mongodb: "disconnected" };
      const data = await res.json();
      return {
        online: true,
        mongodb: data.mongodb === "connected" ? "connected" : "disconnected",
      };
    } catch {
      return { online: false, mongodb: "disconnected" };
    }
  },
};

