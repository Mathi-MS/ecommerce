import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, Category } from "../db/index.js";
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

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const categories = await Category.find();
    res.json(categories.map((c: any) => ({
      id: c._id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      createdAt: c.createdAt,
    })));
  } catch (err) {
    req.log.error({ err }, "List categories error");
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json({
      id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      createdAt: category.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get category error");
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { name, description, imageUrl } = req.body;
    
    if (!name) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }
    
    const slug = slugify(name);
    
    // Check if slug already exists
    const existing = await Category.findOne({ slug });
    if (existing) {
      res.status(400).json({ error: "Category with this name already exists" });
      return;
    }
    
    const category = await Category.create({ 
      name, 
      slug, 
      description: description || undefined, 
      imageUrl: imageUrl || undefined 
    });
    
    res.status(201).json({
      id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      createdAt: category.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Create category error");
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { name, description, imageUrl } = req.body;
    
    if (!name) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }
    
    const slug = slugify(name);
    
    // Check if slug already exists (excluding current category)
    const existing = await Category.findOne({ slug, _id: { $ne: req.params.id } });
    if (existing) {
      res.status(400).json({ error: "Category with this name already exists" });
      return;
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        slug, 
        description: description || undefined, 
        imageUrl: imageUrl || undefined 
      },
      { new: true }
    );
    
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    
    res.json({
      id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      createdAt: category.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Update category error");
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await connectDB();
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete category error");
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
