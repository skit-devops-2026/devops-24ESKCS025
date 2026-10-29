import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hostelfix_mern";

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    isConnected = true;
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
    console.log("   - Create a free M0 cluster and database user");
    console.log("   - Copy the connection string to backend/.env as MONGODB_URI");
    console.log("2. For Local MongoDB:");
    console.log("   - Install MongoDB Community Edition & start service mongod");
    console.log("   - Connection string: mongodb://127.0.0.1:27017/hostelfix_mern");
    console.log("========================================================\n");
  }
};

export const isDbConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};
