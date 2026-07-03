import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY || '' })],
  model: gemini15Flash,
});

/**
 * Genkit-powered NutriBot using Gemini 1.5 Flash.
 * Falls back to a rule-based response if GEMINI_API_KEY is not set or API fails.
 */
async function generateAIResponse(userMessage, conversationHistory = []) {
  if (!process.env.GEMINI_API_KEY) return fallbackResponse(userMessage);

  try {
    // Convert DB history to Genkit format
    const messages = conversationHistory.slice(-6).map(m => ({
      role: m.role === "bot" ? "model" : "user",
      content: [{ text: m.text }],
    }));

    const response = await ai.generate({
      system: SYSTEM_PROMPT,
      messages: messages,
      prompt: userMessage,
      config: {
        temperature: 0.85,
        maxOutputTokens: 600,
      }
    });

    return response.text || fallbackResponse(userMessage);
  } catch (err) {
    console.error("[Genkit API error]", err.message);
    return fallbackResponse(userMessage);
  }
}

const SYSTEM_PROMPT = `You are NutriBot, a friendly, knowledgeable AI meal planning and nutrition assistant integrated into SmartMeal Planner.

Your personality:
- Warm, encouraging, and conversational
- Expert in nutrition, recipes, and meal planning  
- You speak naturally and avoid robotic responses
- You use occasional emojis to make responses lively (🥗 🍳 🥦 ✨)

Your capabilities:
- Suggest recipes based on ingredients, cuisine, dietary needs, or mood
- Provide detailed recipe instructions when asked
- Explain nutritional info (calories, protein, carbs, fat, fiber)
- Create weekly meal plans
- Suggest ingredient substitutions
- Give cooking tips and techniques
- Help with dietary restrictions (vegan, keto, diabetic-friendly, gluten-free, etc.)
- Calculate portion sizes and macros

Rules:
- ALWAYS stay on topic of food, nutrition, cooking, and meal planning
- If asked something completely unrelated (politics, coding, etc.), gently redirect: "I'm best at food and nutrition topics! 🍽️ Can I help you with a recipe or meal plan?"
- For recipe requests, include: ingredients list, step-by-step instructions, and approx. calories
- Keep responses concise but complete (2-5 paragraphs max)
- Never make up dangerous nutrition advice - recommend consulting a doctor for medical dietary needs`;

function fallbackResponse(message) {
  const lower = message.toLowerCase();
  const warning = "\n\n*(Note: I am running in Offline Mode. To unlock my full AI brain for natural language and real recipes, please add your `GEMINI_API_KEY` to the `.env.local` file!)*";
  
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hi there! 👋 I'm NutriBot, your personal nutrition and recipe assistant. Ask me about recipes, meal plans, nutrition facts, or cooking tips!" + warning;
  }
  if (lower.includes("recipe") || lower.includes("cook") || lower.includes("make")) {
    return "I'd love to help with a recipe! 🍳 But since I'm in offline mode, I can't generate new ones right now. Please set your `GEMINI_API_KEY` to unlock this feature!" + warning;
  }
  if (lower.includes("calorie") || lower.includes("nutrition") || lower.includes("healthy")) {
    return "Great question about nutrition! 🥗 For a balanced meal, aim for lean proteins, complex carbs, and plenty of vegetables." + warning;
  }
  return "That's an interesting question! 🤔 But without my Gemini API Key, I can only give pre-programmed responses. Please set `GEMINI_API_KEY` in `.env.local` for true AI chat!" + warning;
}

export async function POST(request) {
  try {
    const { message, userId, firebaseUID } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Load conversation history from DB
    let history = [];
    let db = null;
    try {
      db = await initDb();
      if (db && (userId || firebaseUID)) {
        const session = await db.ChatSession.findOne({
          $or: [{ userId }, { firebaseUID }],
        });
        history = session?.messages || [];
      }
    } catch (dbErr) {
      console.warn("[Chat] DB unavailable, running without history:", dbErr.message);
    }

    const replyText = await generateAIResponse(message, history);

    // Save conversation to DB
    if (db && (userId || firebaseUID)) {
      try {
        await db.ChatSession.findOneAndUpdate(
          { $or: [{ userId }, { firebaseUID }] },
          {
            $set: { userId, firebaseUID, updatedAt: new Date() },
            $push: {
              messages: {
                $each: [
                  { role: "user", text: message, timestamp: new Date() },
                  { role: "bot", text: replyText, timestamp: new Date() },
                ],
              },
            },
          },
          { upsert: true, new: true }
        );
      } catch (saveErr) {
        console.warn("[Chat] Failed to save message:", saveErr.message);
      }
    }

    return NextResponse.json({ text: replyText });
  } catch (err) {
    console.error("[Chat API] Error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json([]);

    const db = await initDb();
    if (!db) return NextResponse.json([]);

    const session = await db.ChatSession.findOne({
      $or: [{ userId }, { firebaseUID: userId }],
    });

    return NextResponse.json(session?.messages || []);
  } catch (err) {
    console.error("[Chat GET]", err.message);
    return NextResponse.json([]);
  }
}
