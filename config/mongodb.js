import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retryCount = 0) => {
  try {
    mongoose.connection.on("connected", () => {
      console.log(`[Commerce Service] MongoDB connected: ${mongoose.connection.name}`);
    });

    mongoose.connection.on("error", (err) => {
      console.error("[Commerce Service] MongoDB connection error:", err.message);
    });

    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.error(
      `[Commerce Service] MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
      error.message
    );

    if (retryCount < MAX_RETRIES - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }

    console.error("[Commerce Service] Max MongoDB connection retries reached. Exiting.");
    process.exit(1);
  }
};

export default connectDB;