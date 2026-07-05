document.addEventListener("DOMContentLoaded", () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
        alert("请先登录");
        location.href = "/login.html";
        return;
    }

    let currentConversationId = null;

    const chatBox = document.getElementById("chatBox");
    const input = document.getElementById("msgInput");
    const list = document.getElementById("conversationList");

    /* ========== 对话列表 ========== */
    async function loadConversations() {
        const res = await fetch(`/api/chat/conversations/${userId}`);
        const data = await res.json();
        list.innerHTML = "";

        data.forEach(conv => {
            const item = document.createElement("div");
            item.className = "conversation-item";
            item.innerHTML = `
                <span>${conv.title}</span>
                <button class="more-btn">⋯</button>
            `;
            item.onclick = () => switchConversation(conv._id);
            list.appendChild(item);
        });
    }

    /* ========== 新建对话 ========== */
    window.createNewChat = async () => {
        const res = await fetch("/api/chat/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId })
        });
        const conv = await res.json();
        currentConversationId = conv._id;
        chatBox.innerHTML = "";
        loadConversations();
    };

    /* ========== 切换对话 + 加载历史 ========== */
    async function switchConversation(id) {
        currentConversationId = id;
        chatBox.innerHTML = "";

        const res = await fetch(`/api/chat/history/${id}`);
        const data = await res.json();

        data.messages.forEach(msg => {
            addMessage(msg.role, msg.content);
        });
    }

    /* ========== 发送消息 + AI 流式 ========== */
    async function sendMessage() {
        if (!currentConversationId) {
            alert("请先新建对话");
            return;
        }

        const text = input.value.trim();
        if (!text) return;
        input.value = "";

        addMessage("user", text);

        // 创建 AI 气泡
        const botBubble = addMessage("assistant", "");

        const res = await fetch("/api/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                conversationId: currentConversationId,
                message: text
            })
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop();

            for (const part of parts) {
                if (part.startsWith("data: ")) {
                    const token = part.slice(6);
                    if (token !== "[DONE]") {
                        botBubble.textContent += token;
                        chatBox.scrollTop = chatBox.scrollHeight;
                    }
                }
            }
        }

        loadConversations();
    }

    window.sendMessage = sendMessage;

    /* ========== 工具函数 ========== */
    function addMessage(role, text) {
        const div = document.createElement("div");
        div.className = role === "user" ? "user-message" : "bot-message";
        div.textContent = text;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return div;
    }

    loadConversations();
});
