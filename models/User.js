const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  progress: {
    type: Map,
    of: {
      score: Number,
      total: Number,
      percentage: Number,
      date: Date
    },
    default: {}
  }
});

module.exports = mongoose.model("User", userSchema);