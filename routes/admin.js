const express = require("express");
const router = express.Router();
const multer = require("multer");
const Chapter = require("../models/Chapter");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.get("/", async (req, res) => {
  const chapters = await Chapter.find();
  res.render("admin", { chapters, action: "Create", chapter: null });
});

router.get("/edit/:id", async (req, res) => {
  const chapter = await Chapter.findById(req.params.id);
  const chapters = await Chapter.find();
  if (!chapter) return res.status(404).render("error", { message: "Chapter not found" });
  res.render("admin", { chapters, action: "Edit", chapter });
});

router.post("/upload", upload.fields([{ name: "easy" }, { name: "medium" }, { name: "hard" }]), async (req, res, next) => {
  try {
    const { title, concept } = req.body;
    const questions = Array.isArray(req.body.questions) ? req.body.questions : (req.body.questions ? [req.body.questions] : []);

    const chapter = new Chapter({
      title,
      concepts: concept || "",
      easyQuestions: req.files.easy ? [{ question: "Easy Question", pdfLink: req.files.easy[0].filename }] : [],
      mediumQuestions: req.files.medium ? [{ question: "Medium Question", pdfLink: req.files.medium[0].filename }] : [],
      hardQuestions: req.files.hard ? [{ question: "Hard Question", pdfLink: req.files.hard[0].filename }] : [],
      questions: questions.map(q => {
        const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean);
        let correctAnswer = q.correctAnswer;
        if (correctAnswer && correctAnswer.startsWith("option")) {
          const optionIndex = parseInt(correctAnswer.replace("option", "")) - 1;
          correctAnswer = options[optionIndex] || options[0] || correctAnswer;
        }
        correctAnswer = options.includes(correctAnswer) ? correctAnswer : options[0] || correctAnswer;
        return {
          question: q.question,
          correctAnswer,
          options,
          difficulty: q.difficulty || "easy"
        };
      }).filter(q => q.question && q.correctAnswer && q.options.length >= 2)
    });
    await chapter.save();
    console.log("Chapter created:", chapter);
    res.redirect("/admin");
  } catch (err) {
    console.error("Error creating chapter:", err);
    next(err);
  }
});

router.post("/update/:id", upload.fields([{ name: "easy" }, { name: "medium" }, { name: "hard" }]), async (req, res, next) => {
  try {
    const { title, concept } = req.body;
    const questions = Array.isArray(req.body.questions) ? req.body.questions : (req.body.questions ? [req.body.questions] : []);

    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).render("error", { message: "Chapter not found" });

    chapter.title = title || chapter.title;
    chapter.concepts = concept || chapter.concepts;

    if (req.files.easy) {
      if (chapter.easyQuestions.length > 0 && chapter.easyQuestions[0].pdfLink) {
        try { fs.unlinkSync(`public/uploads/${chapter.easyQuestions[0].pdfLink}`); } catch (e) { console.log("Failed to delete old easy PDF:", e); }
      }
      chapter.easyQuestions = [{ question: "Easy Question", pdfLink: req.files.easy[0].filename }];
    }
    if (req.files.medium) {
      if (chapter.mediumQuestions.length > 0 && chapter.mediumQuestions[0].pdfLink) {
        try { fs.unlinkSync(`public/uploads/${chapter.mediumQuestions[0].pdfLink}`); } catch (e) { console.log("Failed to delete old medium PDF:", e); }
      }
      chapter.mediumQuestions = [{ question: "Medium Question", pdfLink: req.files.medium[0].filename }];
    }
    if (req.files.hard) {
      if (chapter.hardQuestions.length > 0 && chapter.hardQuestions[0].pdfLink) {
        try { fs.unlinkSync(`public/uploads/${chapter.hardQuestions[0].pdfLink}`); } catch (e) { console.log("Failed to delete old hard PDF:", e); }
      }
      chapter.hardQuestions = [{ question: "Hard Question", pdfLink: req.files.hard[0].filename }];
    }

    if (questions.length > 0) {
      chapter.questions = questions.map(q => {
        const options = [q.option1, q.option2, q.option3, q.option4].filter(Boolean);
        let correctAnswer = q.correctAnswer;
        if (correctAnswer && correctAnswer.startsWith("option")) {
          const optionIndex = parseInt(correctAnswer.replace("option", "")) - 1;
          correctAnswer = options[optionIndex] || options[0] || correctAnswer;
        }
        correctAnswer = options.includes(correctAnswer) ? correctAnswer : options[0] || correctAnswer;
        return {
          question: q.question,
          correctAnswer,
          options,
          difficulty: q.difficulty || "easy"
        };
      }).filter(q => q.question && q.correctAnswer && q.options.length >= 2);
    }

    await chapter.save();
    console.log("Chapter updated:", chapter);
    res.redirect("/admin");
  } catch (err) {
    console.error("Error updating chapter:", err);
    next(err);
  }
});

router.post("/delete/:id", async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).render("error", { message: "Chapter not found" });

    if (chapter.easyQuestions.length > 0 && chapter.easyQuestions[0].pdfLink) {
      try { fs.unlinkSync(`public/uploads/${chapter.easyQuestions[0].pdfLink}`); } catch (e) { console.log("Failed to delete easy PDF:", e); }
    }
    if (chapter.mediumQuestions.length > 0 && chapter.mediumQuestions[0].pdfLink) {
      try { fs.unlinkSync(`public/uploads/${chapter.mediumQuestions[0].pdfLink}`); } catch (e) { console.log("Failed to delete medium PDF:", e); }
    }
    if (chapter.hardQuestions.length > 0 && chapter.hardQuestions[0].pdfLink) {
      try { fs.unlinkSync(`public/uploads/${chapter.hardQuestions[0].pdfLink}`); } catch (e) { console.log("Failed to delete hard PDF:", e); }
    }

    await Chapter.findByIdAndDelete(req.params.id);
    console.log("Chapter deleted:", chapter.title);
    res.redirect("/admin");
  } catch (err) {
    console.error("Error deleting chapter:", err);
    next(err);
  }
});

module.exports = router;