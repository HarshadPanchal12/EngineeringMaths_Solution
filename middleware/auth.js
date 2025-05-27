// middleware/auth.js
module.exports = {
    auth: (req, res, next) => {
      if (!req.session.user) return res.redirect("/login");
      next();
    },
    adminAuth: (req, res, next) => {
      if (!req.session.user || req.session.user.role !== "admin") return res.redirect("/login");
      next();
    }
  };