const express = require("express");
const router = express.Router();
const Chapter = require("../models/Chapter");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id);
    const chapters = await Chapter.find();
    res.render("chapter", { user, chapters, chapter: null }); // Pass chapter as null for dashboard
  } catch (err) {
    next(err);
  }
});

router.get("/:chapterId", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.user._id);
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) return res.status(404).render("error", { message: "Chapter not found" });
    console.log("Chapter data:", chapter); // Debug output
    const chapters = await Chapter.find();
    res.render("chapter", { user, chapter, chapters });
  } catch (err) {
    next(err);
  }
});

module.exports = router;