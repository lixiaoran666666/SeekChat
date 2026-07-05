const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model("users", UserSchema);
