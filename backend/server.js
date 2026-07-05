// 从环境变量中获取 DEEPSEEK_API_KEY
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 添加这一行，让 Express 托管 public 文件夹
app.use(express.static("public"));

// 路由
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

// 连接 MongoDB
mongoose.connect("mongodb://localhost:27017/DeepSeek")
    .then(() => console.log("✅ MongoDB 已连接"))
    .catch(err => console.log("❌ 连接失败：", err));

// 启动服务器
app.listen(5000, () => console.log("🚀 backend 运行在 http://localhost:5000"));
