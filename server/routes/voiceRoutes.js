
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Record from "../models/Record.js";

const router = express.Router();

router.post("/process", async (req, res) => {
  try {
    const { command } = req.body;

    if (!command || !command.trim()) {
      return res.status(400).json({ message: "Command is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Gemini API key is missing" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash-lite"
});

const fallbackModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite"
});

    const prompt = `
      Analyze this user command and return only valid JSON.

      Command: "${command}"

      Return this structure:
      {
        "type": "expense or task",
        "title": "short description",
        "amount": 0,
        "category": "category name",
        "dueDate": null,
        "reply": "short friendly confirmation"
      }

      Rules:
      - Use expense when the user mentions spending money.
      - Use task when the user mentions a task or reminder.
      - For expenses, extract the amount and category.
      - For tasks, extract the due date if provided.
      - Use ISO date format for dueDate.
      - Use null when no due date is mentioned.
      - If the command is unrelated to expenses or tasks, return:
        {"type":"unknown","reply":"I can only manage expenses and tasks."}
    `;

    let result;

try {
  result = await model.generateContent(prompt);
} catch (error) {
  console.log("Primary model unavailable:", error.message);

  result = await fallbackModel.generateContent(prompt);
}

const responseText = result.response.text();

    const cleanedText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    if (parsed.type === "unknown") {
      return res.status(400).json({
        message: parsed.reply
      });
    }

    if (!["expense", "task"].includes(parsed.type) || !parsed.title) {
      return res.status(400).json({
        message: "Could not understand the command"
      });
    }

    if (
      parsed.type === "expense" &&
      (!Number.isFinite(Number(parsed.amount)) || Number(parsed.amount) <= 0)
    ) {
      return res.status(400).json({
        message: "Please provide a valid expense amount"
      });
    }

    const record = await Record.create({
      type: parsed.type,
      title: parsed.title,
      amount: parsed.type === "expense" ? Number(parsed.amount) : 0,
      category: parsed.category || "General",
      dueDate: parsed.type === "task" && parsed.dueDate
        ? new Date(parsed.dueDate)
        : null
    });

    res.status(201).json({
      message: parsed.reply || "Your record has been saved.",
      record
    });
  } catch (error) {
    console.error("Command processing error:", error.message);
    res.status(500).json({
      message: "Unable to process your command. Please try again."
    });
  }
});

router.get("/records", async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch records" });
  }
});

router.patch("/records/:id", async (req, res) => {
  try {
    const record = await Record.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({ message: "Unable to update record" });
  }
});

router.delete("/records/:id", async (req, res) => {
  try {
    const record = await Record.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Unable to delete record" });
  }
});

export default router;
