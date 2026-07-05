const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true }
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
    userId: { type: String, required: true, trim: true },
    title: { type: String, default: "New Chat", trim: true },
    messages: [MessageSchema]
}, { timestamps: true });

ConversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
