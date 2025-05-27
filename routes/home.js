const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Chapter = require("../models/Chapter");

router.get("/", async (req, res, next) => {
  try {
    if (!req.session.user) return res.redirect("/login");
    const user = await User.findById(req.session.user._id);
    const chapters = await Chapter.find();
    res.render("home", { user, chapters });
  } catch (err) {
    next(err);
  }
});

router.get("/progress", async (req, res, next) => {
  try {
    console.log("Session user (raw):", req.session);
    if (!req.session.user || !req.session.user._id) {
      console.log("Redirecting to login due to invalid session");
      return res.redirect("/login");
    }
    const user = await User.findById(req.session.user._id);
    if (!user) return res.redirect("/login");

    // Fetch all chapters to map IDs to titles
    const chapters = await Chapter.find();
    const chapterMap = new Map(chapters.map(ch => [ch._id.toString(), ch.title]));

    // Prepare progress data with chapter titles
    const progress = Array.from(user.progress.entries()).map(([chapterId, progressData]) => ({
      chapterId,
      title: chapterMap.get(chapterId) || "Unknown Chapter",
      score: progressData.score,
      total: progressData.total,
      percentage: progressData.percentage,
      date: progressData.date instanceof Date ? progressData.date : new Date(progressData.date)
    }));

    res.render("progress", { user, progress });
  } catch (err) {
    next(err);
  }
});

module.exports = router;