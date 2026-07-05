require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/DeepSeek";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

async function startServer() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB connected");

        app.listen(PORT, () => {
            console.log(`SeekChat backend running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
}

startServer();
