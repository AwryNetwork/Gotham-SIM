import { Router } from "express";
import bcrypt from "bcryptjs";
import { getUserByUsername } from "../db.js";
import { signToken, requireAuth } from "../auth.js";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }
  const user = getUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = signToken(user);
  res.json({
    token,
    user: { username: user.username, role: user.role, clearance: user.clearance },
  });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
