/**
 * MG Immigration Chatbot — Server Entry Point
 */

require("dotenv").config();
const express = require("express");
const path = require("path");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the test chat UI
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api", apiRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 welcome to MG-international visa consultancy`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`💬 Chat UI: http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`\n✅ Ready to receive messages!\n`);
});
