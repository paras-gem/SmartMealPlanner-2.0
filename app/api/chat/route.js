import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Lazy Genkit initializer ──────────────────────────────────────────────────
// IMPORTANT: Must NOT be initialized at module level — Next.js build will crash.
// We initialize inside the request handler only.
let _ai = null;

async function getAI() {
  if (_ai) return _ai;
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const { genkit } = await import('genkit');
    const { googleAI, gemini15Flash } = await import('@genkit-ai/googleai');
    _ai = genkit({
      plugins: [googleAI({ apiKey })],
      model: gemini15Flash,
    });
    return _ai;
  } catch (err) {
    console.error("[Genkit] Failed to initialize:", err.message);
    return null;
  }
}

// ─── Fallback (no API key) ────────────────────────────────────────────────────

function fallbackResponse(message) {
  const lower = message.toLowerCase();
  const warning = "\n\n*(Note: I'm running in Offline Mode. Add `GEMINI_API_KEY` to `.env.local` to unlock full AI responses!)*";

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hi there! 👋 I'm NutriBot, your personal nutrition and recipe assistant. Ask me about recipes, meal plans, nutrition facts, or cooking tips!" + warning;
  }
  if (lower.includes("recipe") || lower.includes("cook") || lower.includes("make") || lower.includes("how")) {
    return "I'd love to help with a recipe! 🍳 In offline mode I can't generate new ones though. Please set your `GEMINI_API_KEY` to unlock this feature!" + warning;
  }
  if (lower.includes("calorie") || lower.includes("nutrition") || lower.includes("healthy") || lower.includes("diet")) {
    return "Great nutrition question! 🥗 For a balanced meal, aim for lean proteins, complex carbs, and plenty of vegetables. Consider a calorie deficit for weight loss or a surplus for muscle gain." + warning;
  }
  if (lower.includes("vegan") || lower.includes("vegetarian") || lower.includes("keto")) {
    return "Dietary lifestyle questions! 🌱 I can help you with vegan, vegetarian, keto, and many other dietary lifestyles once my AI key is configured. For now: focus on whole foods and variety!" + warning;
  }
  return "That's a great question! 🤔 Please add `GEMINI_API_KEY` in `.env.local` for true AI-powered responses. For now I can only answer basic questions." + warning;
}

// ─── AI Response Generator ────────────────────────────────────────────────────

async function generateAIResponse(userMessage, conversationHistory = []) {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  if (!hasApiKey) return fallbackResponse(userMessage);

  const ai = await getAI();
  if (!ai) return fallbackResponse(userMessage);

  try {
    const messages = conversationHistory.slice(-6).map(m => ({
      role: m.role === "bot" ? "model" : "user",
      content: [{ text: m.text }],
    }));

    const response = await ai.generate({
      system: SYSTEM_PROMPT,
      messages,
      prompt: userMessage,
      config: {
        temperature: 0.85,
        maxOutputTokens: 600,
      },
    });

    const text = response?.text || response?.output?.[0]?.content?.[0]?.text || null;
    return text || fallbackResponse(userMessage);
  } catch (err) {
    console.error("[Genkit API error]", err.message);
    return fallbackResponse(userMessage);
  }
}

// ─── POST: Send a chat message ────────────────────────────────────────────────

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

// ─── GET: Fetch chat history ──────────────────────────────────────────────────

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
