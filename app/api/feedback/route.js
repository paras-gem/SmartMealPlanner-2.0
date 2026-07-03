import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";
import mongoose from "mongoose";

// Create a feedback schema dynamically if it doesn't exist
const feedbackSchema = new mongoose.Schema({
  firebaseUID: String,
  email: String,
  name: String,
  message: String,
  rating: { type: Number, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
}, { strict: false });

export async function POST(request) {
  try {
    const data = await request.json();
    const { message, firebaseUID, email, name, rating } = data;

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    // Initialize the model if it hasn't been already
    const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

    const newFeedback = await Feedback.create({
      firebaseUID: firebaseUID || "Anonymous",
      email: email || "Anonymous",
      name: name || "Anonymous",
      message: message.trim(),
      rating: rating || 5,
    });

    return NextResponse.json({ success: true, feedback: newFeedback });
  } catch (err) {
    console.error("[Feedback API Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
