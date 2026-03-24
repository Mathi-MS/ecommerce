import { Router, type IRouter, type Request, type Response } from "express";
import { db, categoriesTable } from "@workspace/db";

const router: IRouter = Router();

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const categories = await db.select().from(categoriesTable);
    res.json(categories.map((c) => ({
      id: c.id,
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
    const { name, description, imageUrl } = req.body;
    const slug = slugify(name);
    const [category] = await db.insert(categoriesTable).values({
      name,
      slug,
      description: description || null,
      imageUrl: imageUrl || null,
    }).returning();
    res.status(201).json({
      id: category.id,
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
