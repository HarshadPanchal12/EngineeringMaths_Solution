require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");

const homeRouter = require("./routes/home");
const chapterRouter = require("./routes/chapter");
const quizRouter = require("./routes/quiz");
const adminRouter = require("./routes/admin");
const { auth } = require("./middleware/auth"); // Ensure this file exists

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true }
}));

app.set("view engine", "ejs");

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/engineering-maths")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Auth Middleware
const User = require("./models/User");

const adminAuth = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") return res.redirect("/login");
  next();
};

// Routes
app.get("/register", (req, res) => res.render("register", { error: null }));
app.post("/register", async (req, res, next) => {
  try {
    const { fullName, email, username, password } = req.body;
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.render("register", { error: "Username or email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, username, password: hashed, role: "user" });
    await user.save();
    req.session.user = user;
    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

app.get("/login", (req, res) => res.render("login", { error: null }));
app.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user;
      return res.redirect(user.role === "admin" ? "/admin" : "/chapter"); // Redirect to /chapter for users
    }
    res.render("login", { error: "Invalid username or password" });
  } catch (err) {
    next(err);
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.use("/", homeRouter);
app.use("/chapter", auth, chapterRouter); // Protect chapter routes
app.use("/quiz", auth, quizRouter); // Protect quiz routes
app.use("/admin", adminAuth, adminRouter); // Protect admin routes

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { message: "Something went wrong" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));