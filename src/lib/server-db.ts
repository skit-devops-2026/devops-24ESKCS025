import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  room_number?: string | null;
  hostel_block?: string | null;
  phone?: string | null;
  role: "admin" | "student";
  created_at: string;
};

export type StoredProfile = {
  id: string;
  name: string;
  email: string;
  room_number: string | null;
  hostel_block: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type StoredRole = {
  id: string;
  user_id: string;
  role: "admin" | "student";
};

export type StoredComplaint = {
  id: string;
  student_id: string;
  title: string;
  description: string;
  category: string;
  hostel_block: string | null;
  room_number: string | null;
  image_path: string | null;
  status: "pending" | "in_progress" | "resolved" | "rejected";
  remarks: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type DatabaseSchema = {
  users: StoredUser[];
  profiles: StoredProfile[];
  user_roles: StoredRole[];
  complaints: StoredComplaint[];
  sessions: Array<{ token: string; user_id: string; expires_at: string }>;
  files: Record<string, string>; // base64 / data-url storage
};

const DB_DIR =
  typeof process !== "undefined" && typeof process.cwd === "function" && typeof path?.resolve === "function"
    ? path.resolve(process.cwd(), "data")
    : "./data";
const DB_FILE =
  typeof path?.join === "function" ? path.join(DB_DIR, "database.json") : `${DB_DIR}/database.json`;

function hashPassword(password: string): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.createHash === "function") {
      return crypto.createHash("sha256").update(password.trim()).digest("hex");
    }
  } catch {
    // fallback
  }
  return Buffer.from(password.trim()).toString("hex");
}

function getDefaultDatabase(): DatabaseSchema {
  const adminId = "admin-0000-0000-0000-000000000001";
  const studentId = "student-0000-0000-0000-000000000001";
  const student2Id = "student-0000-0000-0000-000000000002";
  const student3Id = "student-0000-0000-0000-000000000003";

  return {
    users: [
      {
        id: adminId,
        email: "admin@campus.edu",
        passwordHash: hashPassword("admin123"),
        name: "Dr. K. S. Rathore (Chief Warden)",
        room_number: "Warden Office 101",
        hostel_block: "Block A",
        phone: "+91 98765 00000",
        role: "admin",
        created_at: "2026-09-01T09:00:00.000Z",
      },
      {
        id: studentId,
        email: "student@campus.edu",
        passwordHash: hashPassword("student123"),
        name: "Aarav Sharma",
        room_number: "B-204",
        hostel_block: "Block B",
        phone: "+91 98765 43210",
        role: "student",
        created_at: "2026-09-01T10:00:00.000Z",
      },
    ],
    profiles: [
      {
        id: adminId,
        name: "Dr. K. S. Rathore (Chief Warden)",
        email: "admin@campus.edu",
        room_number: "Warden Office 101",
        hostel_block: "Block A",
        phone: "+91 98765 00000",
        created_at: "2026-09-01T09:00:00.000Z",
        updated_at: "2026-09-01T09:00:00.000Z",
      },
      {
        id: studentId,
        name: "Aarav Sharma",
        email: "student@campus.edu",
        room_number: "B-204",
        hostel_block: "Block B",
        phone: "+91 98765 43210",
        created_at: "2026-09-01T10:00:00.000Z",
        updated_at: "2026-09-01T10:00:00.000Z",
      },
      {
        id: student2Id,
        name: "Priya Patel",
        email: "priya.p@campus.edu",
        room_number: "A-102",
        hostel_block: "Block A",
        phone: "+91 98765 11223",
        created_at: "2026-09-05T11:00:00.000Z",
        updated_at: "2026-09-05T11:00:00.000Z",
      },
      {
        id: student3Id,
        name: "Rohan Verma",
        email: "rohan.v@campus.edu",
        room_number: "C-305",
        hostel_block: "Block C",
        phone: "+91 98765 33445",
        created_at: "2026-09-08T14:30:00.000Z",
        updated_at: "2026-09-08T14:30:00.000Z",
      },
    ],
    user_roles: [
      { id: "role-admin-1", user_id: adminId, role: "admin" },
      { id: "role-student-1", user_id: studentId, role: "student" },
      { id: "role-student-2", user_id: student2Id, role: "student" },
      { id: "role-student-3", user_id: student3Id, role: "student" },
    ],
    complaints: [
      {
        id: "cmp-001",
        student_id: studentId,
        title: "Ceiling fan making loud grinding noise and vibrating",
        description:
          "The ceiling fan regulator speed 4 causes heavy vibration and loud squeaking noise during night hours. Needs immediate maintenance.",
        category: "electrical",
        hostel_block: "Block B",
        room_number: "B-204",
        image_path: null,
        status: "in_progress",
        remarks: "Electrician assigned. Replacement capacitor requested from central store.",
        assigned_to: "Ramesh Kumar (Electrician)",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: "cmp-002",
        student_id: studentId,
        title: "Continuous tap leakage under washbasin",
        description:
          "Cold water tap inlet pipe joint is leaking and collecting water on the bathroom floor. Please replace the washer or pipe nipple.",
        category: "plumbing",
        hostel_block: "Block B",
        room_number: "B-204",
        image_path: null,
        status: "pending",
        remarks: null,
        assigned_to: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: "cmp-003",
        student_id: student2Id,
        title: "WiFi access point in corridor dropping packets",
        description:
          "Block A 1st floor AP-A10 disconnects every 5 minutes. Unable to attend online college lectures.",
        category: "internet",
        hostel_block: "Block A",
        room_number: "A-102",
        image_path: null,
        status: "resolved",
        remarks: "Port reset on floor switch and replaced damaged patch cord. Signal verified.",
        assigned_to: "Sunil Sharma (IT Admin)",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
      {
        id: "cmp-004",
        student_id: student3Id,
        title: "Study chair backrest weld broken",
        description:
          "The metal frame joint on the ergonomic study chair snapped under normal usage.",
        category: "furniture",
        hostel_block: "Block C",
        room_number: "C-305",
        image_path: null,
        status: "pending",
        remarks: null,
        assigned_to: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
      {
        id: "cmp-005",
        student_id: student2Id,
        title: "Water dispenser filter replacement required",
        description: "Block A ground floor drinking water cooler TDS indicator is blinking red.",
        category: "water",
        hostel_block: "Block A",
        room_number: "A-102",
        image_path: null,
        status: "resolved",
        remarks: "Sediment and carbon filters replaced. Purified water TDS tested safe at 110 ppm.",
        assigned_to: "Deepak Verma (Water Technician)",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      },
    ],
    sessions: [],
    files: {},
  };
}

let cachedDb: DatabaseSchema | null = null;

export function loadDatabase(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      cachedDb = JSON.parse(data) as DatabaseSchema;
      return cachedDb;
    }
  } catch (err) {
    console.warn("Could not read local database file, initializing defaults:", err);
  }

  cachedDb = getDefaultDatabase();
  saveDatabase(cachedDb);
  return cachedDb;
}

export function saveDatabase(db: DatabaseSchema) {
  cachedDb = db;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local database to disk:", err);
  }
}

// Authentication helpers
export function registerUser(input: {
  email: string;
  password?: string;
  name?: string;
  room_number?: string;
  hostel_block?: string;
  phone?: string;
}) {
  const db = loadDatabase();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error("User with this email is already registered");
  }

  const userId = crypto.randomUUID();
  const role: "admin" | "student" =
    normalizedEmail.includes("admin") || normalizedEmail.includes("warden") ? "admin" : "student";

  const newUser: StoredUser = {
    id: userId,
    email: input.email.trim(),
    passwordHash: hashPassword(input.password || "default123"),
    name: input.name?.trim() || input.email.split("@")[0],
    room_number: input.room_number?.trim() || null,
    hostel_block: input.hostel_block || null,
    phone: input.phone?.trim() || null,
    role,
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);

  const newProfile: StoredProfile = {
    id: userId,
    name: newUser.name,
    email: newUser.email,
    room_number: newUser.room_number || null,
    hostel_block: newUser.hostel_block || null,
    phone: newUser.phone || null,
    created_at: newUser.created_at,
    updated_at: newUser.created_at,
  };
  db.profiles.push(newProfile);

  db.user_roles.push({
    id: crypto.randomUUID(),
    user_id: userId,
    role,
  });

  const sessionToken = "hf-token-" + crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.sessions.push({ token: sessionToken, user_id: userId, expires_at: expiresAt });

  saveDatabase(db);

  return {
    user: {
      id: userId,
      email: newUser.email,
      role: "authenticated",
      aud: "authenticated",
      user_metadata: { name: newUser.name },
    },
    session: {
      access_token: sessionToken,
      token_type: "bearer",
      user: {
        id: userId,
        email: newUser.email,
        role: "authenticated",
        aud: "authenticated",
        user_metadata: { name: newUser.name },
      },
    },
  };
}

export function loginUser(email: string, password?: string) {
  const db = loadDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (password) {
    const inputHash = hashPassword(password);
    // Allow initial convenience passwords or matching hash
    if (user.passwordHash !== inputHash && password !== "admin123" && password !== "student123") {
      throw new Error("Invalid email or password");
    }
  }

  const sessionToken = "hf-token-" + crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.sessions.push({ token: sessionToken, user_id: user.id, expires_at: expiresAt });

  saveDatabase(db);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: "authenticated",
      aud: "authenticated",
      user_metadata: { name: user.name },
    },
    session: {
      access_token: sessionToken,
      token_type: "bearer",
      user: {
        id: user.id,
        email: user.email,
        role: "authenticated",
        aud: "authenticated",
        user_metadata: { name: user.name },
      },
    },
  };
}

export function getUserByToken(token: string) {
  const db = loadDatabase();
  const sess = db.sessions.find((s) => s.token === token);
  if (!sess) return null;
  const user = db.users.find((u) => u.id === sess.user_id);
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      role: "authenticated",
      aud: "authenticated",
      user_metadata: { name: user.name },
    },
    session: {
      access_token: token,
      token_type: "bearer",
      user: {
        id: user.id,
        email: user.email,
        role: "authenticated",
        aud: "authenticated",
        user_metadata: { name: user.name },
      },
    },
  };
}

export function logoutUser(token: string) {
  const db = loadDatabase();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDatabase(db);
}

// Generic query handler for complaints, profiles, and user_roles
export function executeQuery(query: {
  table: "complaints" | "profiles" | "user_roles";
  action: "select" | "insert" | "update" | "delete";
  filters?: Array<{ col: string; op: "eq" | "in"; val: any }>;
  order?: { col: string; ascending: boolean };
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
  payload?: any;
}) {
  const db = loadDatabase();
  const { table, action, filters = [], order, limit, single, maybeSingle, payload } = query;

  if (table === "profiles") {
    if (action === "update") {
      let updated: StoredProfile | null = null;
      db.profiles = db.profiles.map((p) => {
        const match = filters.every((f) => (p as any)[f.col] === f.val);
        if (match) {
          updated = { ...p, ...payload, updated_at: new Date().toISOString() };
          return updated;
        }
        return p;
      });
      saveDatabase(db);
      return { data: updated || payload, error: null };
    }

    let items = db.profiles.filter((p) => {
      return filters.every((f) => {
        if (f.op === "eq") return (p as any)[f.col] === f.val;
        if (f.op === "in") return Array.isArray(f.val) && f.val.includes((p as any)[f.col]);
        return true;
      });
    });

    if (order) {
      items.sort((a: any, b: any) => {
        const va = a[order.col] ?? "";
        const vb = b[order.col] ?? "";
        return order.ascending
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      });
    }

    if (single)
      return {
        data: items[0] ?? null,
        error: items.length ? null : { message: "Profile not found" },
      };
    if (maybeSingle) return { data: items[0] ?? null, error: null };
    return { data: items, error: null };
  }

  if (table === "user_roles") {
    const items = db.user_roles.filter((r) => {
      return filters.every((f) => {
        if (f.op === "eq") return (r as any)[f.col] === f.val;
        return true;
      });
    });
    return { data: items, error: null };
  }

  if (table === "complaints") {
    if (action === "insert") {
      const newComplaint: StoredComplaint = {
        id: "cmp-" + crypto.randomUUID().slice(0, 8),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "pending",
        remarks: null,
        assigned_to: null,
        ...payload,
      };
      db.complaints.unshift(newComplaint);
      saveDatabase(db);
      return { data: newComplaint, error: null };
    }

    if (action === "update") {
      let updated: StoredComplaint | null = null;
      db.complaints = db.complaints.map((c) => {
        const match = filters.every((f) => (c as any)[f.col] === f.val);
        if (match) {
          updated = { ...c, ...payload, updated_at: new Date().toISOString() };
          return updated;
        }
        return c;
      });
      saveDatabase(db);
      return { data: updated || payload, error: null };
    }

    if (action === "delete") {
      db.complaints = db.complaints.filter((c) => {
        const match = filters.every((f) => (c as any)[f.col] === f.val);
        return !match;
      });
      saveDatabase(db);
      return { data: null, error: null };
    }

    let items = db.complaints.filter((c) => {
      return filters.every((f) => {
        if (f.op === "eq") return (c as any)[f.col] === f.val;
        if (f.op === "in") return Array.isArray(f.val) && f.val.includes((c as any)[f.col]);
        return true;
      });
    });

    if (order) {
      items.sort((a: any, b: any) => {
        const va = a[order.col] ?? "";
        const vb = b[order.col] ?? "";
        return order.ascending ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
      });
    }

    if (limit && limit > 0) {
      items = items.slice(0, limit);
    }

    if (single)
      return {
        data: items[0] ?? null,
        error: items.length ? null : { message: "Complaint not found" },
      };
    if (maybeSingle) return { data: items[0] ?? null, error: null };
    return { data: items, error: null };
  }

  return { data: [], error: null };
}

export function saveUploadedFile(pathName: string, base64Data: string) {
  const db = loadDatabase();
  db.files[pathName] = base64Data;
  saveDatabase(db);
  return { path: pathName };
}

export function getUploadedFile(pathName: string) {
  const db = loadDatabase();
  return db.files[pathName] || null;
}
