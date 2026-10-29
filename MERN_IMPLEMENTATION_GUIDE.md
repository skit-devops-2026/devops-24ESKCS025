# MERN Stack Implementation Guide & Viva Cheatsheet — HostelFix

This guide provides a comprehensive, beginner-friendly walkthrough of the **MERN (MongoDB, Express.js, React.js, Node.js)** integration in this repository.

---

## 1. What MERN Stack Means

**MERN** is an acronym for four open-source technologies that work together to form a full-stack JavaScript web application:

```
┌────────────────────────────────────────────────────────┐
│                   MERN ARCHITECTURE                    │
├───────────────┬────────────────────────┬───────────────┤
│ Layer         │ Technology             │ Role          │
├───────────────┼────────────────────────┼───────────────┤
│ Frontend      │ React.js               │ User Interface│
│ Web Server    │ Express.js             │ REST API      │
│ Runtime       │ Node.js                │ JS Engine     │
│ Database      │ MongoDB (Mongoose)     │ NoSQL Data    │
└───────────────┴────────────────────────┴───────────────┘
```

1. **M — MongoDB**: A NoSQL document database. Instead of tables and rows with rigid schemas like SQL, MongoDB stores records as flexible, JSON-like BSON documents. In our app, it stores **Hostel Maintenance Records**.
2. **E — Express.js**: A minimalist, flexible web application framework for Node.js. It handles routing (`/api/records`), middleware (JSON parsing, CORS), and incoming HTTP requests (`GET`, `POST`, `PUT`, `DELETE`).
3. **R — React.js**: A declarative frontend JavaScript library for building interactive user interfaces using reusable components, state hooks (`useState`), and effect hooks (`useEffect`).
4. **N — Node.js**: An asynchronous, event-driven JavaScript runtime built on Chrome's V8 engine that allows JavaScript to run directly on the server (outside the browser).

---

## 2. What Changed: Files Created & Modified

| File Path                                                                                                                                    | Type     | Purpose                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| [`backend/config/db.js`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/config/db.js)                                     | Created  | Connects to MongoDB (Atlas or Local) via Mongoose with graceful timeout and reconnection handling.             |
| [`backend/models/Record.js`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/models/Record.js)                             | Created  | Defines the Mongoose Schema & Model for hostel maintenance records with validation and timestamps.             |
| [`backend/routes/recordRoutes.js`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/routes/recordRoutes.js)                 | Created  | Express REST API router implementing full CRUD operations (`GET`, `POST`, `PUT`, `DELETE`).                    |
| [`backend/server.js`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/server.js)                                           | Created  | Main Express entrypoint: configures CORS, JSON body parser, healthcheck, routes, and error handling.           |
| [`backend/.env.example`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/.env.example)                                     | Created  | Sample environment file for the Express backend.                                                               |
| [`src/lib/mern-api.ts`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/lib/mern-api.ts)                                       | Created  | Frontend client service connecting React components to the Express REST API endpoints via `fetch`.             |
| [`src/routes/records.tsx`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/routes/records.tsx)                                 | Created  | Interactive React page displaying MongoDB records, status indicators, and an interactive record creation form. |
| [`src/lib/__tests__/mern-backend.test.ts`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/lib/__tests__/mern-backend.test.ts) | Created  | Vitest automated tests covering Mongoose schema validation, default values, and enum constraints.              |
| [`src/components/layout.tsx`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/src/components/layout.tsx)                           | Modified | Added `MERN Records` navigation link in the top navigation bar.                                                |
| [`package.json`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/package.json)                                                     | Modified | Added backend dependencies (`express`, `mongoose`, `cors`, `dotenv`) and npm scripts (`server`, `server:dev`). |
| [`.env.example`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/.env.example)                                                     | Modified | Added `VITE_MERN_API_URL` and `MONGODB_URI` environment documentation.                                         |

---

## 3. How Data Flows in the MERN Stack

Here is the exact step-by-step lifecycle of creating and viewing a maintenance record:

```
[1. User enters form data in React UI (/records)]
                  │
                  ▼
[2. React triggers mernApi.createRecord(form)]
                  │
                  ▼ (HTTP POST http://localhost:5000/api/records)
[3. Express server receives request on Port 5000]
                  │
                  ▼
[4. CORS middleware validates origin (http://localhost:8080)]
                  │
                  ▼
[5. express.json() parses body into req.body]
                  │
                  ▼
[6. Router validates required fields (title, description)]
                  │
                  ▼
[7. Mongoose calls Record.create(req.body)]
                  │
                  ▼ (MongoDB wire protocol TCP/TLS)
[8. MongoDB stores document in 'records' collection & assigns _id]
                  │
                  ▼
[9. Express sends HTTP 201 Created with saved record JSON]
                  │
                  ▼
[10. React receives response, updates state, and renders card with Sonner toast]
```

---

## 4. REST API Documentation

Base URL: `http://localhost:5000/api/records`

### 1. Get All Records

- **Endpoint:** `GET /api/records`
- **Query Parameters (Optional):**
  - `category` (e.g. `electrical`, `plumbing`, `internet`)
  - `status` (e.g. `pending`, `in_progress`, `resolved`)
  - `block` (e.g. `Block A`, `Block B`)
- **Status:** `200 OK`
- **Sample Response:**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6720d588e1a539b9829f0321",
      "title": "Water purifier filter replacement",
      "description": "Ground floor cooler TDS indicator is blinking red",
      "category": "water",
      "hostelBlock": "Block A",
      "roomNumber": "101",
      "studentName": "Aarav Sharma",
      "status": "pending",
      "priority": "medium",
      "assignedTo": "Unassigned",
      "createdAt": "2026-10-29T11:55:00.000Z",
      "updatedAt": "2026-10-29T11:55:00.000Z"
    }
  ]
}
```

---

### 2. Get Single Record by ID

- **Endpoint:** `GET /api/records/:id`
- **URL Parameter:** `id` (24-character hexadecimal MongoDB ObjectId)
- **Status:** `200 OK` (or `404 Not Found`, `400 Bad Request` if invalid hex)
- **Sample Response:**

```json
{
  "success": true,
  "data": {
    "_id": "6720d588e1a539b9829f0321",
    "title": "Water purifier filter replacement",
    "description": "Ground floor cooler TDS indicator is blinking red",
    "category": "water",
    "status": "pending"
  }
}
```

---

### 3. Create a New Record

- **Endpoint:** `POST /api/records`
- **Headers:** `Content-Type: application/json`
- **Status:** `201 Created` (or `400 Bad Request` if missing required fields)
- **Sample Request Body:**

```json
{
  "title": "Corridor WiFi access point offline",
  "description": "AP-B12 dropped signal on second floor corridor",
  "category": "internet",
  "hostelBlock": "Block B",
  "roomNumber": "204",
  "studentName": "Priya Patel",
  "priority": "high"
}
```

- **Sample Response:**

```json
{
  "success": true,
  "message": "Record created successfully in MongoDB",
  "data": {
    "_id": "6720d588e1a539b9829f0322",
    "title": "Corridor WiFi access point offline",
    "description": "AP-B12 dropped signal on second floor corridor",
    "category": "internet",
    "hostelBlock": "Block B",
    "roomNumber": "204",
    "studentName": "Priya Patel",
    "status": "pending",
    "priority": "high",
    "assignedTo": "Unassigned",
    "createdAt": "2026-10-29T12:00:00.000Z",
    "updatedAt": "2026-10-29T12:00:00.000Z"
  }
}
```

---

### 4. Update an Existing Record

- **Endpoint:** `PUT /api/records/:id`
- **Status:** `200 OK` (or `404 Not Found`)
- **Sample Request Body:**

```json
{
  "status": "in_progress",
  "assignedTo": "Sunil IT Staff"
}
```

- **Sample Response:**

```json
{
  "success": true,
  "message": "Record updated successfully in MongoDB",
  "data": {
    "_id": "6720d588e1a539b9829f0322",
    "status": "in_progress",
    "assignedTo": "Sunil IT Staff"
  }
}
```

---

### 5. Delete a Record

- **Endpoint:** `DELETE /api/records/:id`
- **Status:** `200 OK` (or `404 Not Found`)
- **Sample Response:**

```json
{
  "success": true,
  "message": "Record deleted successfully from MongoDB",
  "data": {
    "id": "6720d588e1a539b9829f0322"
  }
}
```

---

## 5. Installation Instructions

Dependencies for the MERN backend have already been added to the project. If starting on a fresh machine:

```powershell
# 1. Clone repository and navigate to folder
cd devops-24ESKCS025

# 2. Install all frontend and backend dependencies
npm install
```

Installed MERN packages:

- `express`: Fast Node.js web framework.
- `mongoose`: MongoDB Object Data Modeling (ODM) library.
- `cors`: Cross-Origin Resource Sharing middleware.
- `dotenv`: Zero-dependency module that loads environment variables from `.env`.

---

## 6. Database Setup: MongoDB Atlas vs Local MongoDB

You can run MongoDB using either **Cloud (Atlas)** or **Local Community Edition**.

### Option A: MongoDB Atlas Cloud (Recommended — Free & No Installation)

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a new **Free Shared Cluster (M0)**.
3. Under **Database Access**, create a database user (e.g., username `hosteladmin`, password `securepass123`).
4. Under **Network Access**, click **Add IP Address** -> Choose **Allow Access from Anywhere (`0.0.0.0/0`)** for development.
5. In your cluster view, click **Connect** -> **Drivers** -> Copy the connection string:
   ```
   mongodb+srv://hosteladmin:securepass123@cluster0.abcde.mongodb.net/hostelfix_mern?retryWrites=true&w=majority
   ```
6. Paste this URI into [`backend/.env`](file:///c:/Users/aines/OneDrive/Desktop/devops-24ESKCS025/backend/.env):
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://hosteladmin:securepass123@cluster0.abcde.mongodb.net/hostelfix_mern?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB

1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community).
2. Install MongoDB as a Windows Service.
3. Ensure the service is running (`net start MongoDB` or check Services).
4. Default connection string in `backend/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/hostelfix_mern
   ```

---

## 7. How to Run the Project (Windows PowerShell)

For complete development, run the Frontend and the Backend in **two separate PowerShell terminals**:

### Terminal 1: Start Express MERN Backend

```powershell
cd c:\Users\aines\OneDrive\Desktop\devops-24ESKCS025
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run server
```

_Expected Output:_

```
🚀 HostelFix MERN Backend Server running on port 5000
📍 Local API URL: http://localhost:5000
[MongoDB] Connected successfully to host: ...
```

---

### Terminal 2: Start React Frontend

```powershell
cd c:\Users\aines\OneDrive\Desktop\devops-24ESKCS025
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
npm run dev
```

_Expected Output:_

```
VITE v8.2.0 ready in ... ms
➜ Local: http://localhost:8080/
```

Open your browser at `http://localhost:8080/records` to use the live MERN interface.

---

## 8. How to Verify CRUD & MongoDB Persistence

1. **Verify Server Health:**
   Open browser or terminal:

   ```powershell
   curl http://localhost:5000/api/health
   ```

   Confirm JSON response: `{"status":"ok","mongodb":"connected"}`.

2. **Create a Record (C):**
   - In the React page (`/records`), fill in:
     - Title: `Water cooler leakage`
     - Description: `Pipe leaking on floor`
     - Click **Save Record**.
   - Notice the instant feedback and new card appearing in the list.

3. **Read Records (R):**
   - Refresh the page or click the **Refresh** button.
   - The records are fetched live from `GET /api/records`.

4. **Update Record (U):**
   - On any record card, use the **Update Status** dropdown to change `pending` to `in_progress` or `resolved`.
   - The `PUT /api/records/:id` endpoint updates the document in MongoDB.

5. **Delete Record (D):**
   - Click the red trash icon on any record.
   - Confirm deletion prompt.
   - The `DELETE /api/records/:id` endpoint removes it from MongoDB.

---

## 9. Troubleshooting Common Issues

| Issue                                                 | Cause                                                 | Fix                                                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `connect ECONNREFUSED 127.0.0.1:27017`                | Local MongoDB service is not started.                 | Start MongoDB locally via `net start MongoDB` or use MongoDB Atlas connection string in `backend/.env`.           |
| `MongooseServerSelectionError: connection timed out`  | MongoDB Atlas IP access list blocked your current IP. | In Atlas Dashboard -> Network Access -> Add `0.0.0.0/0` (Allow from anywhere).                                    |
| `TypeError: Failed to fetch`                          | The Express backend is not running.                   | Run `npm run server` in a terminal window on port 5000.                                                           |
| `CORS Error: No 'Access-Control-Allow-Origin' header` | Frontend origin is not allowed in Express CORS.       | Ensure `http://localhost:8080` is in `cors()` origins inside `backend/server.js`.                                 |
| `EADDRINUSE: address already in use :::5000`          | Another process is occupying port 5000.               | In PowerShell run: `Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess \| Stop-Process -Force`. |

---

## 10. Viva & Interview Questions with Answers

### Q1: What does MERN stand for, and what role does each component play?

**Answer:** MERN stands for MongoDB (database storing JSON-like documents), Express.js (backend web framework providing REST APIs), React.js (frontend library rendering UI components), and Node.js (JavaScript runtime executing server code).

### Q2: What is Mongoose and why do we use it with MongoDB?

**Answer:** Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It provides schema validation, type enforcement, middleware (hooks), and convenient query helper methods (e.g. `findByIdAndUpdate`).

### Q3: What is the difference between a SQL and NoSQL database?

**Answer:** SQL databases (like PostgreSQL, MySQL) are relational and use structured tables with fixed columns, foreign keys, and strict schemas. NoSQL databases (like MongoDB) are non-relational and store flexible, JSON-like BSON documents that can easily evolve without migration downtime.

### Q4: What is CORS and why is it needed in a MERN stack?

**Answer:** CORS stands for Cross-Origin Resource Sharing. Browsers block requests made from one origin (frontend at `http://localhost:8080`) to another origin (backend at `http://localhost:5000`) for security. The `cors` package in Express sends headers that permit the frontend to communicate with the backend.

### Q5: What are the standard HTTP methods in a RESTful API?

**Answer:**

- `GET`: Retrieve data (safe and idempotent).
- `POST`: Create a new resource.
- `PUT`: Update/replace an existing resource.
- `PATCH`: Partially update an existing resource.
- `DELETE`: Remove a resource.

### Q6: What is middleware in Express.js?

**Answer:** Middleware functions are functions that have access to the request object (`req`), the response object (`res`), and the `next` function in the application’s request-response cycle. They can execute code, modify request/response objects, end the request, or call `next()`. Examples include `express.json()` and `cors()`.

### Q7: What is an ObjectId in MongoDB?

**Answer:** An ObjectId is a special 12-byte (24-character hexadecimal) BSON type used as the default unique primary key (`_id`) for every document in MongoDB. It encodes a 4-byte timestamp, 5-byte random value, and a 3-byte incrementing counter.

### Q8: What is `express.json()` and why do we need it?

**Answer:** `express.json()` is built-in Express middleware that parses incoming requests with JSON payloads (Content-Type: `application/json`) and makes the parsed data available under `req.body`. Without it, `req.body` would be `undefined`.

### Q9: What HTTP status codes are used for CRUD operations?

**Answer:**

- `200 OK`: Request succeeded (GET, PUT, DELETE).
- `201 Created`: Resource successfully created (POST).
- `400 Bad Request`: Client sent invalid or missing data.
- `404 Not Found`: Requested resource does not exist.
- `500 Internal Server Error`: Unhandled server-side exception.
- `503 Service Unavailable`: Server or database is temporarily unavailable.

### Q10: How does React communicate with an Express backend?

**Answer:** React components use standard asynchronous browser APIs like `fetch()` (or third-party libraries like `axios`) inside functions or `useEffect` hooks to send HTTP requests to Express API endpoints, receive JSON data, and update component state (`useState`) to trigger a UI re-render.
