# HostelFix — New MERN Feature Implementation Guide: Asset & Inventory Management

This document provides a comprehensive guide to the **Hostel Asset & Spare Parts Inventory Management** system, a new feature built using the **MERN Stack (MongoDB, Express.js, React.js, Node.js)** in the HostelFix repository.

---

## 1. Feature Name & Purpose

* **Feature Name:** Hostel Asset & Spare Parts Inventory Management System
* **Module URL / Route:** `/inventory`
* **API Base Endpoint:** `http://localhost:5000/api/assets`
* **Purpose:** Provides hostel administrators, wardens, and maintenance staff with a real-time, persistent inventory tracker for electrical spares, plumbing fixtures, internet hardware, water fittings, and hostel furniture needed to fulfill student maintenance complaints.

---

## 2. Why This Feature Was Selected for HostelFix

1. **Bridges the Gap Between Complaints and Resolution:**
   HostelFix previously allowed residents to report broken fixtures (e.g., burned-out fan regulators, broken water taps, failing Wi-Fi access points). However, the maintenance staff had no digital record of whether replacement components were in stock, which block stored them, or when buffer thresholds were breached.
2. **Operational Reality of Hostel Living:**
   Unplanned stockouts cause prolonged delays in hostel room repairs. When an electrician receives five electrical complaints in Block B, this feature allows them to instantly check stock, issue parts for repair, or request procurement when items reach **Low Stock**.
3. **True MERN Architecture:**
   The feature utilizes every layer of the MERN stack:
   * **M (MongoDB):** Persistent NoSQL document storage with schema validation, indexes, and virtual fields.
   * **E (Express.js):** REST API with route handlers, error middleware, and database connectivity guards.
   * **R (React.js):** Declarative frontend with real-time health badges, KPI metrics, dynamic filters, and optimistic updates.
   * **N (Node.js):** Non-blocking server runtime powering asynchronous I/O and API execution.

---

## 3. What the Feature Does & How Users Interact With It

Users interact with the system through the `/inventory` route:

1. **Live Service Health Monitoring:**
   * Automatically pings `GET /api/health` to confirm that the Node/Express backend is online on port 5000 and connected to MongoDB.
2. **KPI Metrics Overview (Summary Dashboard):**
   * **Distinct Items:** Count of unique inventory models catalogued.
   * **Total Units in Stock:** Aggregate physical quantity across all blocks.
   * **Low Stock Alerts:** Items whose stock is at or below their minimum buffer threshold (`quantity <= minThreshold`), highlighted with animated warnings.
   * **Total Valuation:** Total inventory worth in Indian Rupees (`₹`), computed as $\sum (\text{quantity} \times \text{unitCost})$.
3. **Filter & Search Bar:**
   * Text search by asset name, storage location, or vendor/supplier.
   * Filter by category: *Electrical*, *Plumbing*, *Internet*, *Furniture*, *Cleanliness*, *Water*, *Other*.
   * Filter by hostel block: *Block A*, *Block B*, *Block C*, *Block D*, *Block E*, *Central Store*, *Maintenance Workshop*.
   * Filter by condition: *Brand New*, *Good / Ready*, *Needs Servicing*, *Out of Stock*.
   * One-click toggle: **"Low Stock Only"** to quickly review items needing replenishment.
4. **CRUD Actions:**
   * **Create (C):** Add a new asset with name, category, block, location, quantity, buffer threshold, unit cost, and vendor details.
   * **Read (R):** Fetch, view, and sort real-time inventory from MongoDB.
   * **Update (U):** Full edit modal to update specifications, locations, or pricing.
   * **Quick Stock Adjuster:** One-click `[-] Issue 1` (consumes an item for repair) and `[+] Restock 1` (adds an item), with immediate UI updates.
   * **Delete (D):** Remove decommissioned or obsolete items with a confirmation prompt.

---

## 4. Technologies Used & MERN Implementation

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MERN ARCHITECTURE FLOW                          │
├─────────────────┬──────────────────────────┬───────────────────────────┤
│ Layer           │ Technology               │ Role in Asset Inventory   │
├─────────────────┼──────────────────────────┼───────────────────────────┤
│ Frontend (UI)   │ React 19 + TanStack      │ UI components, filters,   │
│                 │ Router + Lucide Icons    │ live stock meters, toasts │
├─────────────────┼──────────────────────────┼───────────────────────────┤
│ Client Service  │ TypeScript fetch client  │ HTTP calls to backend     │
│                 │ (inventory-api.ts)       │ endpoints on port 5000    │
├─────────────────┼──────────────────────────┼───────────────────────────┤
│ Backend Server  │ Express.js 5 on Node.js  │ Routing, request parsing, │
│                 │                          │ validation, health checks │
├─────────────────┼──────────────────────────┼───────────────────────────┤
│ Database ODM    │ Mongoose 9 (Asset model) │ Schema enforcement, enums,│
│                 │                          │ virtual getters, methods  │
├─────────────────┼──────────────────────────┼───────────────────────────┤
│ Database Engine │ MongoDB Atlas / Local    │ BSON document persistence │
└─────────────────┴──────────────────────────┴───────────────────────────┘
```

---

## 5. Files Created & Modified

| File Path | Type | Purpose |
| :--- | :--- | :--- |
| [`backend/models/Asset.js`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/models/Asset.js) | **Created** | Mongoose schema and model defining inventory fields, validation rules, enums, and virtuals (`isLowStock`, `totalValue`). |
| [`backend/routes/assetRoutes.js`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/routes/assetRoutes.js) | **Created** | Express REST router implementing CRUD, KPI aggregation (`/summary`), and quick stock adjustment (`/stock`). |
| [`src/lib/inventory-api.ts`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/lib/inventory-api.ts) | **Created** | Frontend API client communicating with backend endpoints via `fetch` with error propagation. |
| [`src/routes/inventory.tsx`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/routes/inventory.tsx) | **Created** | Full React page displaying KPI cards, filters, interactive asset cards, stock adjusters, and modals. |
| [`src/lib/__tests__/asset-backend.test.ts`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/lib/__tests__/asset-backend.test.ts) | **Created** | Automated Vitest test suite verifying Mongoose schema validation, default values, enums, and virtual getters. |
| [`backend/server.js`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/server.js) | **Modified** | Mounted `/api/assets` router, updated root API catalog and console startup diagnostics. |
| [`src/components/layout.tsx`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/components/layout.tsx) | **Modified** | Added "Asset Inventory" navigation links to header navbar, mobile drawer, and footer. |
| [`src/routeTree.gen.ts`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/routeTree.gen.ts) | **Generated** | Automatically updated by TanStack Router to register the `/inventory` route. |

---

## 6. MongoDB Schema & Field Definitions

Defined in [`backend/models/Asset.js`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/models/Asset.js):

```javascript
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
  }
);
```

### Schema Virtuals:
* `isLowStock`: Returns `true` when `this.quantity <= this.minThreshold`.
* `totalValue`: Returns `(this.quantity || 0) * (this.unitCost || 0)`.

---

## 7. REST API Documentation & Examples

Base URL: `http://localhost:5000/api/assets`

### 1. Get Inventory Summary (KPIs)
* **Endpoint:** `GET /api/assets/summary`
* **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "totalDistinct": 8,
    "totalQuantity": 142,
    "lowStockCount": 2,
    "totalValuation": 42800,
    "byCategory": {
      "electrical": 3,
      "plumbing": 2,
      "internet": 1,
      "water": 2
    }
  }
}
```

### 2. Get All Assets (with Filters & Search)
* **Endpoint:** `GET /api/assets`
* **Query Parameters:**
  * `category` (optional, e.g. `electrical`)
  * `block` (optional, e.g. `Block A`)
  * `condition` (optional, e.g. `good`)
  * `lowStock` (optional, `true` returns only low-stock items)
  * `search` (optional, regex on name, location, or supplier)
* **Response `200 OK`:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "67220ea19fc4b45508a8e101",
      "name": "Havells 1200mm Ceiling Fan",
      "category": "electrical",
      "hostelBlock": "Block A",
      "location": "Electrical Store 101",
      "quantity": 12,
      "minThreshold": 5,
      "unit": "units",
      "condition": "good",
      "unitCost": 1850,
      "supplier": "Havells India Authorized Distributor",
      "isLowStock": false,
      "totalValue": 22200,
      "createdAt": "2026-10-30T10:00:00.000Z",
      "updatedAt": "2026-10-30T10:00:00.000Z"
    }
  ]
}
```

### 3. Create a New Asset
* **Endpoint:** `POST /api/assets`
* **Request Body:**
```json
{
  "name": "Brass Bib Tap 1/2 Inch",
  "category": "plumbing",
  "hostelBlock": "Block B",
  "location": "Plumbing Yard Shelf 2",
  "quantity": 15,
  "minThreshold": 5,
  "unit": "pieces",
  "condition": "new",
  "unitCost": 320,
  "supplier": "City Hardware Mart",
  "notes": "Suitable for washroom basins in Block B"
}
```
* **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Asset created successfully in MongoDB",
  "data": {
    "_id": "67220ea19fc4b45508a8e102",
    "name": "Brass Bib Tap 1/2 Inch",
    "category": "plumbing",
    "quantity": 15,
    "unitCost": 320
  }
}
```

### 4. Update an Existing Asset
* **Endpoint:** `PUT /api/assets/:id`
* **Request Body:**
```json
{
  "unitCost": 340,
  "notes": "Price updated after revised invoice from vendor"
}
```
* **Response `200 OK`:** Returns updated asset document.

### 5. Quick Stock Adjustment (Issue or Restock)
* **Endpoint:** `PATCH /api/assets/:id/stock`
* **Request Body:**
```json
{
  "change": -1,
  "notes": "Used for room B-204 tap leak repair"
}
```
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Stock updated successfully (-1). New quantity: 14",
  "data": {
    "_id": "67220ea19fc4b45508a8e102",
    "quantity": 14
  }
}
```

### 6. Delete an Asset
* **Endpoint:** `DELETE /api/assets/:id`
* **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Asset deleted successfully from MongoDB",
  "data": { "id": "67220ea19fc4b45508a8e102" }
}
```

---

## 8. Data Flow Lifecycle

```
[1. User clicks "+ Restock 1" or submits form in React (/inventory)]
                                │
                                ▼
[2. React triggers inventoryApi.adjustStock(id, 1) or createAsset(data)]
                                │
                                ▼ (HTTP PATCH/POST http://localhost:5000/api/assets)
[3. Express server receives request on Port 5000]
                                │
                                ▼
[4. CORS middleware validates origin (http://localhost:8080)]
                                │
                                ▼
[5. express.json() parses request body into req.body]
                                │
                                ▼
[6. Router validates ObjectId, required fields, and quantity constraints]
                                │
                                ▼
[7. Mongoose updates/creates document via Asset.findByIdAndUpdate / Asset.create]
                                │
                                ▼ (MongoDB wire protocol TCP/TLS)
[8. MongoDB persists document in 'assets' collection]
                                │
                                ▼
[9. Express returns JSON response (200 OK / 201 Created)]
                                │
                                ▼
[10. React receives updated asset, updates component state, and triggers Sonner toast]
```

---

## 9. Environment Configuration & Database Setup

The MERN backend reads environment variables from [`backend/.env`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/.env):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hostelfix?retryWrites=true&w=majority
```

### Option A: MongoDB Atlas (Cloud — Recommended)
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. In **Network Access**, ensure your current IP is whitelisted, or add `0.0.0.0/0` (allow from anywhere) for development access.
3. In **Database Access**, verify your database user has read/write privileges.
4. Copy the connection string to `backend/.env`.

### Option B: Local MongoDB
1. Ensure the local MongoDB service is running:
   ```powershell
   net start MongoDB
   ```
2. Set the connection URI in `backend/.env`:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/hostelfix_mern
   ```

---

## 10. How to Run the Project (Windows PowerShell)

For full full-stack development, run the backend and frontend in **two separate PowerShell terminals**:

### Terminal 1: Start Express MERN Backend
```powershell
cd c:\Users\aines\OneDrive\Desktop\devops-24ESKCS025
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm.cmd run server
```

*Expected Output:*
```
======================================================
🚀 HostelFix MERN Backend Server running on port 5000
📍 Local API URL:    http://localhost:5000
📍 Records Endpoint: http://localhost:5000/api/records
📍 Assets Endpoint:  http://localhost:5000/api/assets
📍 Health Check:     http://localhost:5000/api/health
======================================================
```

### Terminal 2: Start React Frontend
```powershell
cd c:\Users\aines\OneDrive\Desktop\devops-24ESKCS025
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm.cmd run dev
```

*Expected Output:*
```
VITE v8.2.0 ready in ... ms
➜ Local: http://localhost:8080/
```

Open `http://localhost:8080/inventory` in your browser.

---

## 11. Automated Tests & Actual Results

Automated unit tests were implemented in [`src/lib/__tests__/asset-backend.test.ts`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/lib/__tests__/asset-backend.test.ts) covering:
1. Rejection of empty objects missing required `name`.
2. Automatic application of default values (`quantity: 0`, `minThreshold: 5`, `condition: "good"`).
3. Acceptance of all standard complaint categories.
4. Rejection of invalid category enums.
5. Acceptance of valid condition enums (`new`, `good`, `needs_repair`, `depleted`).
6. Rejection of unsupported condition values.
7. Enforcement of non-negative bounds on `quantity` and `unitCost`.
8. Dynamic calculation of the `isLowStock` virtual getter.
9. Calculation of the `totalValue` virtual getter.
10. String trimming on `name`, `hostelBlock`, and `supplier`.

### Test Execution Command:
```powershell
npm.cmd test -- --run
```

### Actual Verified Output:
```
✓ src/lib/__tests__/complaint-utils.test.ts (15 tests)
✓ src/lib/__tests__/metrics.test.ts (3 tests)
✓ src/lib/__tests__/local-db.test.ts (6 tests)
✓ src/lib/__tests__/system-health.test.ts (4 tests)
✓ src/lib/__tests__/utils.test.ts (5 tests)
✓ src/lib/__tests__/mern-backend.test.ts (5 tests)
✓ src/lib/__tests__/asset-backend.test.ts (10 tests)

Test Files  7 passed (7)
     Tests  48 passed (48)
```

### Production Build Verification:
```powershell
npm.cmd run build
```
*Result:* Built client and SSR bundles with **0 errors**.

---

## 12. 10 Viva & Interview Questions with Detailed Answers

### Q1: What is the purpose of the Asset & Inventory Management feature in HostelFix?
**Answer:** It manages the physical equipment, fixtures, and replacement parts required to resolve student hostel complaints. When complaints are lodged (e.g. leaking tap or broken fan), wardens and electricians use this system to check stock availability, consume parts for repairs, monitor low-stock thresholds, and reorder supplies before rooms remain unusable.

### Q2: How does the MERN stack function together in this feature?
**Answer:**
* **MongoDB:** Stores inventory records as flexible BSON documents using Mongoose schemas.
* **Express.js:** Exposes RESTful endpoints (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with middleware for parsing, CORS, and connectivity checks.
* **React.js:** Renders the user interface with dynamic filter controls, KPI metric widgets, modal forms, and real-time status badges.
* **Node.js:** Executes the backend server asynchronously without blocking thread pools on database I/O.

### Q3: What is a Mongoose Virtual, and how is it used here?
**Answer:** A virtual is a document property that is computed on the fly and not directly persisted to the database. In our `Asset` model, `isLowStock` evaluates `this.quantity <= this.minThreshold` dynamically, and `totalValue` computes `quantity * unitCost`. Setting `{ toJSON: { virtuals: true } }` ensures these values are automatically serialized into JSON responses sent to React.

### Q4: Why did we implement a PATCH route in addition to PUT?
**Answer:** While `PUT /api/assets/:id` replaces or updates the full asset record, `PATCH /api/assets/:id/stock` is specifically designed for quick delta updates (e.g., deducting 1 unit when used for a repair or adding 5 units during restocking). This avoids transmitting the full entity and provides an atomic, dedicated path for inventory adjustments.

### Q5: How is data validation handled across frontend and backend?
**Answer:** We follow defense-in-depth:
1. **Frontend:** HTML5 form constraints (`required`, `min="0"`, `type="number"`) and client-side pre-checks prevent malformed payloads before dispatching HTTP requests.
2. **Backend Router:** Validates MongoDB ObjectIds (`mongoose.Types.ObjectId.isValid`) and checks required fields.
3. **Mongoose Schema:** Enforces schema types, string lengths (`minlength`, `maxlength`), enums (`category`, `condition`), and numerical validators (`min: 0`).

### Q6: What happens if MongoDB becomes unreachable or the connection drops?
**Answer:** The custom `checkDbConnection` Express middleware inspects `isDbConnected()` before executing queries. If MongoDB is unreachable, it returns HTTP `503 Service Unavailable` with a descriptive message rather than hanging indefinitely. On the frontend, React displays a non-blocking warning banner with exact troubleshooting steps (`npm run server` or IP whitelist checks) while keeping the rest of the application responsive.

### Q7: What is the difference between MongoDB `find()` and aggregation pipelines?
**Answer:** `find()` retrieves matching documents based on filter criteria. Aggregation pipelines (`Asset.aggregate()`) pass documents through multi-stage transformations (such as `$match`, `$group`, `$facet`, and `$project`) to perform computations on the database server. In our `/summary` endpoint, we aggregate total inventory volume, low-stock counts, and valuations across the dataset.

### Q8: Why do we use CORS middleware in our Express server?
**Answer:** The React development server runs on port `8080`, while the Express backend runs on port `5000`. By default, browsers enforce the Same-Origin Policy (SOP) and block cross-origin requests. The `cors` middleware sends HTTP headers (`Access-Control-Allow-Origin: http://localhost:8080`) permitting the React client to make asynchronous requests to the API.

### Q9: How does the "Low Stock Alert" logic work?
**Answer:** Each asset defines a `minThreshold` (buffer quantity). Whenever an item's `quantity` falls below or matches `minThreshold`, its virtual `isLowStock` evaluates to `true`. On the frontend, this triggers a prominent red `LOW STOCK` badge with visual warning indicators. Users can filter by low-stock items with a single click to generate replenishment orders.

### Q10: How do you verify that data persists across application restarts?
**Answer:** When an asset is created via `POST /api/assets`, Mongoose issues an `insert` command to MongoDB, which commits the BSON document to disk storage. You can stop both the React frontend and Express backend terminals, restart them, and query `GET /api/assets` or open `/inventory` — all previously saved assets, quantities, and notes persist unaltered.

### Q11: How is access control implemented for asset inventory and maintenance records?
**Answer:** We enforce a Role-Based Access Control (RBAC) policy:
- **Head Warden (`role: 'admin'`):** Full administrative privileges to create new assets, edit equipment details, restock or issue inventory units, and delete obsolete entries, as well as add, update status, and delete maintenance records.
- **Resident Students (`role: 'student'`):** Authenticated read-only access to view current inventory levels and hostel maintenance records. Create, edit, restock, issue, and delete controls are automatically hidden and guarded against unauthorized actions.
- **Unauthenticated Guests:** Prompted with clear call-to-action notices directing them to sign in before taking administrative action.

