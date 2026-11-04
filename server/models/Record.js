
import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["expense", "task"],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      default: "General"
    },
    dueDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const Record = mongoose.model("Record", recordSchema);

export default Record;
