import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB, User } from "@workspace/db";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "elowell-secret-key-2024";

router.post("/register", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone: phone || undefined, role: "customer" });
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.json({ success: true });
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
