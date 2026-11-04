
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import voiceRoutes from "./routes/voiceRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", voiceRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
