import mongoose from "mongoose";

let isConnected = false;
let retryTimer = null;

// Listen to mongoose connection events
mongoose.connection.on("connected", () => {
  isConnected = true;
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  scheduleReconnect();
});

mongoose.connection.on("error", (err) => {
  isConnected = false;
  console.error(`[MongoDB] Runtime Error: ${err.message}`);
  scheduleReconnect();
});

function scheduleReconnect() {
  if (!retryTimer && !isConnected) {
    retryTimer = setTimeout(async () => {
      retryTimer = null;
      if (!isDbConnected()) {
        console.log("[MongoDB] Attempting reconnection...");
        await connectDB();
      }
    }, 10000);
  }
}

export const connectDB = async () => {
  if (isDbConnected()) return mongoose.connection;
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hostelfix_mern";

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    isConnected = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    console.log(`[MongoDB] Database name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    console.log("\n========================================================");
    console.log("MongoDB Setup Guidance:");
    console.log("1. For MongoDB Atlas (Cloud - Free):");
    console.log("   - Sign up at https://www.mongodb.com/cloud/atlas");
    console.log("   - In Network Access, add 0.0.0.0/0 (Allow from anywhere)");
    console.log("   - Current public IP or network might be blocked by Atlas IP Access List.");
    console.log("2. For Local MongoDB:");
    console.log("   - Install MongoDB Community Edition & start service mongod");
    console.log("   - Connection string: mongodb://127.0.0.1:27017/hostelfix_mern");
    console.log("========================================================\n");
    scheduleReconnect();
  }
};

export const isDbConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};
