const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com"
});

/**
 * 新建对话
 */
router.post("/new", async (req, res) => {
    try {
        const { userId } = req.body;
        console.log("创建新对话:", userId);
        const conv = await Conversation.create({
            userId,
            title: "新对话",
            messages: []
        });
        console.log("创建成功:", conv._id);
        res.json(conv);
    } catch (err) {
        console.error("创建失败:", err);
        res.status(500).json({ error: "创建失败" });
    }
});

/**
 * 获取用户对话列表
 */
router.get("/conversations/:userId", async (req, res) => {
    const list = await Conversation.find({ userId: req.params.userId })
        .sort({ updatedAt: -1 });
    res.json(list);
});

/**
 * 获取历史消息
 */
router.get("/history/:conversationId", async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
        return res.status(400).json({ error: "非法 ID" });
    }
    const conv = await Conversation.findById(req.params.conversationId);
    if (!conv) return res.status(404).json({ error: "不存在" });
    res.json({ messages: conv.messages });
});

/**
 * 发送消息（流式）
 */
router.post("/send", async (req, res) => {
    const { userId, conversationId, message } = req.body;

    let conv = await Conversation.findById(conversationId);
    if (!conv) {
        conv = await Conversation.create({
            userId,
            title: "新对话",
            messages: []
        });
    }

    conv.messages.push({ role: "user", content: message });
    await conv.save();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.flushHeaders();

    const stream = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: conv.messages,
        stream: true
    });

    let aiReply = "";

    for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content || "";
        aiReply += text;
        if (text) res.write(`data: ${text}\n\n`);
    }

    conv.messages.push({ role: "assistant", content: aiReply });

    if (conv.title === "新对话") {
        conv.title = message.slice(0, 20);
    }

    await conv.save();

    res.write("data: [DONE]\n\n");
    res.end();
});

/**
 * 删除对话
 */
router.delete("/delete/:conversationId", async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
        return res.status(400).json({ error: "非法 ID" });
    }
    await Conversation.findByIdAndDelete(req.params.conversationId);
    res.json({ success: true });
});

/**
 * 重命名
 */
router.put("/rename/:conversationId", async (req, res) => {
    const { title } = req.body;
    const conv = await Conversation.findByIdAndUpdate(
        req.params.conversationId,
        { title },
        { new: true }
    );
    res.json(conv);
});

/**
 * 置顶
 */
router.put("/pin/:conversationId", async (req, res) => {
    const conv = await Conversation.findByIdAndUpdate(
        req.params.conversationId,
        { updatedAt: Date.now() },
        { new: true }
    );
    res.json(conv);
});

module.exports = router;
