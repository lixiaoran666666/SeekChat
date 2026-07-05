const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/login", async (req, res, next) => {
    try {
        const username = String(req.body.username || "").trim();
        const password = String(req.body.password || "").trim();

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const user = await User.findOne({ username, password }).select("_id username");

        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        res.json({ message: "Login successful", userId: user._id, username: user.username });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
