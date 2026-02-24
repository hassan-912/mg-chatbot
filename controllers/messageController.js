/**
 * Message Controller
 * Handles the core flow: receive message → RAG search → LLM → respond
 */

const knowledgeBase = require("../models/knowledgeBase");
const llm = require("../models/llm");

/**
 * Process a chat message and return AI response.
 * @param {string} sessionId - The session/user ID
 * @param {string} message - The user's message text
 * @returns {object} - { reply, sources }
 */
async function handleMessage(sessionId, message) {
    // Step 1: Search knowledge base for relevant context
    const results = knowledgeBase.search(message, 3);

    // Step 2: Build context string from search results
    let context = "";
    if (results.length > 0) {
        context = results
            .map((r, i) => `[${i + 1}] ${r.title}:\n${r.content}`)
            .join("\n\n---\n\n");
    }

    // Step 3: Generate LLM response with context
    const reply = await llm.generateResponse(sessionId, message, context);

    // Step 4: Return response with source info
    return {
        reply,
        sources: results.map(r => r.title)
    };
}

/**
 * Reset conversation for a session
 */
function resetConversation(sessionId) {
    llm.clearHistory(sessionId);
    return { reply: "تم مسح المحادثة. منورنا من أول وجديد! 😊 عايز تسأل عن إيه؟" };
}

/**
 * List all available programs
 */
function getPrograms() {
    return knowledgeBase.listPrograms();
}

module.exports = { handleMessage, resetConversation, getPrograms };
