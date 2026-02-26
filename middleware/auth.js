const jwt = require("jsonwebtoken");

export default function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded data to req
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.redirect("/login");
  }
}
