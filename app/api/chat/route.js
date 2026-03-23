import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const PYTHON_BACKEND_URL = process.env.CHATBOT_BACKEND_URL || "http://localhost:8000";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/skillmatrix";

// Reuse MongoDB connection across requests
let cachedClient = null;
async function getDB() {
  if (!cachedClient) {
    cachedClient = await MongoClient.connect(MONGODB_URI);
  }
  return cachedClient.db();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, userContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Call Python AI backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        user_context: userContext || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.detail || "Backend error" }, { status: response.status });
    }

    const data = await response.json();

    // Save chat to MongoDB
    try {
      const db = await getDB();
      const userMessage = messages[messages.length - 1];
      await db.collection("chathistory").insertOne({
        userMessage: userMessage?.content || "",
        botReply: data.reply,
        model: data.model,
        userContext: userContext || null,
        createdAt: new Date(),
      });
    } catch (dbError) {
      // Don't fail the request if MongoDB save fails
      console.error("MongoDB save error:", dbError);
    }

    return NextResponse.json({ reply: data.reply, model: data.model });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to connect to chatbot service" }, { status: 500 });
  }
}

// GET — fetch last 50 chat messages
export async function GET() {
  try {
    const db = await getDB();
    const history = await db
      .collection("chathistory")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Chat history error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}