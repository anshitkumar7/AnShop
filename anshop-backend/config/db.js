const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_URI_FALLBACK;
  const allowWithoutDb = process.env.ALLOW_WITHOUT_DB === "true";

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing. Add it in your .env file.");
  }

  mongoose.set("bufferCommands", false);

  const options = {
    serverSelectionTimeoutMS: 15000,
    family: 4,
  };

  try {
    await mongoose.connect(mongoUri, options);

    console.log("MongoDB Atlas Connected ✅");
    return { connected: true, source: "atlas" };
  } catch (error) {
    console.error("Atlas DB Error:", error.message);

    if (fallbackUri) {
      try {
        await mongoose.connect(fallbackUri, options);
        console.log("MongoDB Fallback Connected ✅");
        return { connected: true, source: "fallback" };
      } catch (fallbackError) {
        console.error("Fallback DB Error:", fallbackError.message);
      }
    }

    if (allowWithoutDb) {
      console.warn("Starting server WITHOUT database connection (ALLOW_WITHOUT_DB=true).");
      return { connected: false, source: "none" };
    }

    throw error;
  }
};

module.exports = connectDB;