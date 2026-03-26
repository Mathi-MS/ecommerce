import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, Category } from "../db/index.js";

const router: IRouter = Router();

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
    })));
  } catch (err) {
    req.log.error({ err }, "List categories error");
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { name, description, imageUrl } = req.body;
    const slug = slugify(name);
    const category = await Category.create({ name, slug, description: description || undefined, imageUrl: imageUrl || undefined });
    res.status(201).json({
      id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
    });
  } catch (err) {
    req.log.error({ err }, "Create category error");
    res.status(500).json({ error: "Failed to create category" });
  }
});

export default router;
