/**
 * LLM Integration — Groq API with Llama 3
 * Handles AI response generation with conversation context.
 */

const Groq = require("groq-sdk");
const { SYSTEM_PROMPT } = require("../config/prompts");

// Validate API key on load
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey || apiKey === "your_groq_api_key_here") {
    console.error("⚠️  WARNING: GROQ_API_KEY is not set in .env file!");
} else {
    console.log(`✅ Groq API key loaded (${apiKey.substring(0, 8)}...)`);
}

const groq = new Groq({ apiKey });

// In-memory conversation history per user (keyed by session ID)
const conversations = new Map();
const MAX_HISTORY = 10; // Keep last 10 messages per user

/**
 * Generate a response from the LLM.
 * @param {string} sessionId - Unique session/user ID
 * @param {string} userMessage - The user's message
 * @param {string} context - Retrieved knowledge base context
 * @returns {string} - The AI response in Egyptian Arabic
 */
async function generateResponse(sessionId, userMessage, context) {
    // Get or create conversation history
    if (!conversations.has(sessionId)) {
        conversations.set(sessionId, []);
    }
    const history = conversations.get(sessionId);

    // Build the context-enhanced user message
    const enhancedMessage = context
        ? `السؤال: ${userMessage}\n\nالسياق من قاعدة البيانات:\n${context}`
        : `السؤال: ${userMessage}`;

    // Add user message to history
    history.push({ role: "user", content: enhancedMessage });

    // Trim history if too long
    while (history.length > MAX_HISTORY) {
        history.shift();
    }

    try {
        console.log(`📨 Calling Groq API for session: ${sessionId}...`);

        // Add a 30-second timeout using AbortController
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const completion = await groq.chat.completions.create(
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...history
                ],
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 0.9,
            },
            { signal: controller.signal }
        );

        clearTimeout(timeout);

        const reply = completion.choices[0]?.message?.content || "عذراً، حصل مشكلة. حاول تاني.";
        console.log(`✅ Got response (${reply.length} chars)`);

        // Add assistant response to history
        history.push({ role: "assistant", content: reply });

        return reply;
    } catch (error) {
        console.error("❌ Groq API Error:", error.message);
        console.error("   Error details:", error.status || "N/A", error.code || "N/A");

        if (error.name === "AbortError") {
            return "عذراً يا فندم، الرد أخد وقت طويل. حاول تاني. ⏳";
        }
        if (error.status === 401 || error.message?.includes("api_key") || error.message?.includes("Invalid API Key")) {
            return "⚠️ مفيش API Key صحيح — محتاج تضيف GROQ_API_KEY في ملف .env وتعيد تشغيل السيرفر";
        }
        if (error.status === 429) {
            return "عذراً يا فندم، في ضغط حالياً. حاول تاني بعد دقيقة. 🙏";
        }

        return "عذراً يا فندم، في مشكلة تقنية حالياً. حاول تاني بعد شوية. 🙏";
    }
}

/**
 * Clear a user's conversation history
 */
function clearHistory(sessionId) {
    conversations.delete(sessionId);
}

module.exports = { generateResponse, clearHistory };

