const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const OpenAI = require("openai");
const Conversation = require("../models/Conversation");

const DEFAULT_TITLE = "New Chat";

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function getDeepSeekClient() {
    if (!process.env.DEEPSEEK_API_KEY) {
        const err = new Error("DEEPSEEK_API_KEY is not configured");
        err.status = 500;
        throw err;
    }

    return new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
    });
}

router.post("/new", async (req, res, next) => {
    try {
        const userId = String(req.body.userId || "").trim();
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const conversation = await Conversation.create({
            userId,
            title: DEFAULT_TITLE,
            messages: []
        });

        res.status(201).json(conversation);
    } catch (err) {
        next(err);
    }
});

router.get("/conversations/:userId", async (req, res, next) => {
    try {
        const userId = String(req.params.userId || "").trim();
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const conversations = await Conversation.find({ userId })
            .sort({ updatedAt: -1 })
            .select("_id title updatedAt createdAt");

        res.json(conversations);
    } catch (err) {
        next(err);
    }
});

router.get("/history/:conversationId", async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation id" });
        }

        const conversation = await Conversation.findById(conversationId).select("messages");
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        res.json({ messages: conversation.messages });
    } catch (err) {
        next(err);
    }
});

router.post("/send", async (req, res, next) => {
    const userId = String(req.body.userId || "").trim();
    const conversationId = String(req.body.conversationId || "").trim();
    const message = String(req.body.message || "").trim();

    if (!userId || !conversationId || !message) {
        return res.status(400).json({ message: "userId, conversationId, and message are required" });
    }

    if (!isValidObjectId(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation id" });
    }

    let conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
    }

    conversation.messages.push({ role: "user", content: message });
    await conversation.save();

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
        const client = getDeepSeekClient();
        const stream = await client.chat.completions.create({
            model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
            messages: conversation.messages.map(({ role, content }) => ({ role, content })),
            stream: true
        });

        let aiReply = "";

        for await (const chunk of stream) {
            const text = chunk.choices?.[0]?.delta?.content || "";
            if (!text) continue;
            aiReply += text;
            res.write(`data: ${JSON.stringify(text)}\n\n`);
        }

        conversation.messages.push({ role: "assistant", content: aiReply });
        if (conversation.title === DEFAULT_TITLE) {
            conversation.title = message.slice(0, 30);
        }

        await conversation.save();
        res.write("data: [DONE]\n\n");
        res.end();
    } catch (err) {
        console.error("DeepSeek request failed:", err);
        res.write(`event: error\ndata: ${JSON.stringify(err.message || "AI request failed")}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
    }
});

router.delete("/delete/:conversationId", async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation id" });
        }

        await Conversation.findByIdAndDelete(conversationId);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

router.put("/rename/:conversationId", async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const title = String(req.body.title || "").trim();

        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation id" });
        }

        if (!title) {
            return res.status(400).json({ message: "title is required" });
        }

        const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { title: title.slice(0, 80) },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        res.json(conversation);
    } catch (err) {
        next(err);
    }
});

router.put("/pin/:conversationId", async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation id" });
        }

        const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { updatedAt: new Date() },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        res.json(conversation);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
