const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 登录验证
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });

  if (!user) {
    return res.status(401).json({ message: "用户名或密码错误" });
  }

  res.json({ message: "登录成功", userId: user._id });
});

module.exports = router;
