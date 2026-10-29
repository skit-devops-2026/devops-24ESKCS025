export type MernRecord = {
  _id: string;
  title: string;
  description: string;
  category:
    "electrical" | "plumbing" | "internet" | "furniture" | "cleanliness" | "water" | "other";
  hostelBlock: string;
  roomNumber: string;
  studentName: string;
  status: "pending" | "in_progress" | "resolved" | "rejected";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

const API_BASE = import.meta.env.VITE_MERN_API_URL || "http://localhost:5000/api";

export const mernApi = {
  async getRecords(params?: { category?: string; status?: string; block?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== "all") {
      searchParams.set("category", params.category);
    }
    if (params?.status && params.status !== "all") {
      searchParams.set("status", params.status);
    }
    if (params?.block && params.block !== "all") {
      searchParams.set("block", params.block);
    }

    const query = searchParams.toString();
    const url = `${API_BASE}/records${query ? `?${query}` : ""}`;
    const res = await fetch(url);
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to fetch records (${res.status})`);
    }

    return (result.data || []) as MernRecord[];
  },

  async getRecordById(id: string) {
    const res = await fetch(`${API_BASE}/records/${id}`);
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to fetch record (${res.status})`);
    }

    return result.data as MernRecord;
  },

  async createRecord(record: {
    title: string;
    description: string;
    category?: string;
    hostelBlock?: string;
    roomNumber?: string;
    studentName?: string;
    priority?: string;
  }) {
    const res = await fetch(`${API_BASE}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to create record (${res.status})`);
    }

    return result.data as MernRecord;
  },

  async updateRecord(id: string, updates: Partial<MernRecord>) {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to update record (${res.status})`);
    }

    return result.data as MernRecord;
  },

  async deleteRecord(id: string) {
    const res = await fetch(`${API_BASE}/records/${id}`, {
      method: "DELETE",
    });
    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Failed to delete record (${res.status})`);
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
