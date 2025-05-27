const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true }, // Array of options
  correctAnswer: { type: String, required: true }, // Correct answer from options
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' } // Difficulty level
});

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  concepts: { type: String, default: '' }, // Text describing the chapter concepts
  questions: [questionSchema], // Array of interactive quiz questions
  easyQuestions: [{
    question: String,
    pdfLink: String // URL or path to PDF file
  }],
  mediumQuestions: [{
    question: String,
    pdfLink: String
  }],
  hardQuestions: [{
    question: String,
    pdfLink: String
  }]
});

module.exports = mongoose.model("Chapter", chapterSchema);