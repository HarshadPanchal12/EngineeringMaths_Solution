const express = require("express");
const router = express.Router();
const Chapter = require("../models/Chapter");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

router.get("/:chapterId", auth, async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) return res.status(404).render("error", { message: "Chapter not found" });
    res.render("quiz", { chapter });
  } catch (err) {
    next(err);
  }
});

router.post("/:chapterId/submit", auth, async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) return res.status(404).render("error", { message: "Chapter not found" });

    const answers = req.body;
    let score = 0;
    const results = chapter.questions.map((q, index) => {
      const userAnswer = answers[`answer-${index}`];
      // Map legacy "option1", "option2", etc. to the corresponding option value
      let effectiveCorrectAnswer = q.correctAnswer;
      if (q.correctAnswer && q.correctAnswer.startsWith("option")) {
        const optionIndex = parseInt(q.correctAnswer.replace("option", "")) - 1;
        effectiveCorrectAnswer = q.options[optionIndex] || q.correctAnswer;
      }
      const isCorrect = userAnswer === effectiveCorrectAnswer;
      if (isCorrect) score++;
      return {
        question: q.question || `Question ${index + 1}`,
        userAnswer: userAnswer || "Not answered",
        correctAnswer: effectiveCorrectAnswer,
        isCorrect
      };
    });

    let user = null;
    if (req.session.user) {
      user = await User.findById(req.session.user._id);
      const progressData = {
        score: score,
        total: chapter.questions.length,
        percentage: ((score / chapter.questions.length) * 100).toFixed(2),
        date: new Date()
      };
      user.progress.set(chapter._id.toString(), progressData);
      await user.save();
      console.log("Saved progress:", progressData);
    }

    res.render("quiz-result", { chapter, results, score, total: chapter.questions.length, user: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;