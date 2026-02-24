/**
 * MG Immigration Chatbot — Frontend Logic
 */

const messagesContainer = document.getElementById("messagesContainer");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.querySelector(".sidebar");

// Generate a unique session ID
const sessionId = "session_" + Math.random().toString(36).substr(2, 9) + Date.now();

// ── Send Message ──
messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    sendMessage(message);
});

async function sendMessage(message) {
    // Add user message to chat
    addMessage(message, "user");
    messageInput.value = "";
    messageInput.style.height = "auto";
    sendBtn.disabled = true;

    // Show typing indicator
    const typingEl = showTyping();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, sessionId })
        });

        const data = await response.json();

        // Remove typing indicator
        typingEl.remove();

        if (data.error) {
            addMessage("عذراً، حصل مشكلة. حاول تاني. ❌", "bot");
        } else {
            addMessage(data.reply, "bot", data.sources);
        }
    } catch (err) {
        typingEl.remove();
        addMessage("مش قادر أتواصل مع السيرفر. تأكد إنه شغال. 🔌", "bot");
    }

    sendBtn.disabled = false;
    messageInput.focus();
}

// ── Add Message to DOM ──
function addMessage(text, type, sources = []) {
    const msg = document.createElement("div");
    msg.className = `message ${type}-message`;

    const avatarEmoji = type === "bot" ? "🤖" : "👤";
    const timeLabel = type === "bot" ? "مساعد MG" : "أنت";

    let sourcesHTML = "";
    if (sources && sources.length > 0) {
        sourcesHTML = `
      <div class="message-sources">
        ${sources.map(s => `<span class="source-tag">📄 ${s}</span>`).join("")}
      </div>
    `;
    }

    msg.innerHTML = `
    <div class="message-avatar">${avatarEmoji}</div>
    <div class="message-content">
      <div class="message-bubble">${formatText(text)}</div>
      ${sourcesHTML}
      <span class="message-time">${timeLabel} • ${getTime()}</span>
    </div>
  `;

    messagesContainer.appendChild(msg);
    scrollToBottom();
}

// ── Format text (preserve line breaks, basic markdown) ──
function formatText(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

// ── Typing Indicator ──
function showTyping() {
    const typing = document.createElement("div");
    typing.className = "message bot-message";
    typing.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
    messagesContainer.appendChild(typing);
    scrollToBottom();
    return typing;
}

// ── Helpers ──
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getTime() {
    return new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ── Auto-resize textarea ──
messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
});

// ── Enter to send (Shift+Enter for newline) ──
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event("submit"));
    }
});

// ── Quick action buttons ──
document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const msg = btn.dataset.msg;
        if (msg) sendMessage(msg);
    });
});

// ── Program sidebar buttons ──
document.querySelectorAll(".program-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const query = btn.dataset.query;
        if (query) {
            sendMessage(query);
            // Close mobile sidebar if open
            sidebar.classList.remove("open");
            const overlay = document.querySelector(".sidebar-overlay");
            if (overlay) overlay.classList.remove("active");
        }
    });
});

// ── Reset conversation ──
resetBtn.addEventListener("click", async () => {
    try {
        await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "/reset", sessionId })
        });
    } catch (e) { }

    // Clear messages and show welcome again
    messagesContainer.innerHTML = `
    <div class="message bot-message">
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="message-bubble">
          أهلاً بيك يا فندم! 👋 منورنا في MG للهجرة.
          <br><br>
          أنا مساعد MG، وأقدر أساعدك في أي استفسار عن:
          <br>
          🇩🇪 ألمانيا • 🇨🇦 كندا • 🇺🇸 أمريكا • 🇦🇺 أستراليا • 🇳🇿 نيوزيلندا • 🇪🇺 أوروبا
          <br><br>
          اسألني أي سؤال أو اختار برنامج من القائمة! 💪
        </div>
        <span class="message-time">مساعد MG</span>
      </div>
    </div>
  `;
});

// ── Mobile menu ──
mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");

    // Create/toggle overlay
    let overlay = document.querySelector(".sidebar-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("active");
        });
    }
    overlay.classList.toggle("active");
});
