/**
 * API Routes — Chat & Health endpoints
 */

const express = require("express");
const router = express.Router();
const { handleMessage, resetConversation, getPrograms } = require("../controllers/messageController");

// Health check
router.get("/", (req, res) => {
    res.json({
        status: "running",
        name: "MG Immigration Chatbot",
        version: "1.0.0"
    });
});

// Chat endpoint
router.post("/chat", async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        if (!message || !sessionId) {
            return res.status(400).json({ error: "message and sessionId are required" });
        }

        // Handle reset command
        if (message.trim() === "/reset") {
            const result = resetConversation(sessionId);
            return res.json(result);
        }

        const result = await handleMessage(sessionId, message);
        res.json(result);
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "حصل مشكلة في المعالجة" });
    }
});

// List available programs
router.get("/programs", (req, res) => {
    const programs = getPrograms();
    res.json({ programs });
});

module.exports = router;
