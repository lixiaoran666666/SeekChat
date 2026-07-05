const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true }
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, default: "新对话" },
    messages: [MessageSchema],
}, { timestamps: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
