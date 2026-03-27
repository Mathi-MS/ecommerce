import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, Banner } from "../db/index.js";
import jwt from "jsonwebtoken";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "elowell-secret-key-2024";

// Middleware to check admin role
function requireAdmin(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { active } = req.query;
    const filter: any = {};
    if (active !== undefined) filter.isActive = active === "true";
    
    const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(banners.map((b: any) => ({
      id: b._id,
      title: b.title,
      subtitle: b.subtitle,
      description: b.description,
      imageUrl: b.imageUrl,
      button1Text: b.button1Text,
      button1Link: b.button1Link,
      button2Text: b.button2Text,
      button2Link: b.button2Link,
      order: b.order,
      isActive: b.isActive,
      createdAt: b.createdAt,
    })));
  } catch (err) {
    req.log.error({ err }, "List banners error");
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }
    res.json({
      id: banner._id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.imageUrl,
      button1Text: banner.button1Text,
      button1Link: banner.button1Link,
      button2Text: banner.button2Text,
      button2Link: banner.button2Link,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get banner error");
    res.status(500).json({ error: "Failed to fetch banner" });
  }
});

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { title, subtitle, description, imageUrl, button1Text, button1Link, button2Text, button2Link, order, isActive } = req.body;
    
    if (!title || !description || !imageUrl) {
      res.status(400).json({ error: "Title, description, and image are required" });
      return;
    }
    
    const banner = await Banner.create({
      title,
      subtitle: subtitle || undefined,
      description,
      imageUrl,
      button1Text: button1Text || undefined,
      button1Link: button1Link || undefined,
      button2Text: button2Text || undefined,
      button2Link: button2Link || undefined,
      order: Number(order) || 0,
      isActive: Boolean(isActive ?? true),
    });
    
    res.status(201).json({
      id: banner._id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.imageUrl,
      button1Text: banner.button1Text,
      button1Link: banner.button1Link,
      button2Text: banner.button2Text,
      button2Link: banner.button2Link,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Create banner error");
    res.status(500).json({ error: "Failed to create banner" });
  }
});

router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { title, subtitle, description, imageUrl, button1Text, button1Link, button2Text, button2Link, order, isActive } = req.body;
    
    if (!title || !description || !imageUrl) {
      res.status(400).json({ error: "Title, description, and image are required" });
      return;
    }
    
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      {
        title,
        subtitle: subtitle || undefined,
        description,
        imageUrl,
        button1Text: button1Text || undefined,
        button1Link: button1Link || undefined,
        button2Text: button2Text || undefined,
        button2Link: button2Link || undefined,
        order: Number(order) || 0,
        isActive: Boolean(isActive ?? true),
      },
      { new: true }
    );
    
    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }
    
    res.json({
      id: banner._id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.imageUrl,
      button1Text: banner.button1Text,
      button1Link: banner.button1Link,
      button2Text: banner.button2Text,
      button2Link: banner.button2Link,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Update banner error");
    res.status(500).json({ error: "Failed to update banner" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const banner = await Banner.findByIdAndDelete(req.params.id);
    
    if (!banner) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }
    
    res.json({ message: "Banner deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete banner error");
    res.status(500).json({ error: "Failed to delete banner" });
  }
});

export default router;