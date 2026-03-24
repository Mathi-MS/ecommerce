import { Router, type IRouter, type Request, type Response } from "express";
import { db, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, sql, desc, ne } from "drizzle-orm";

const router: IRouter = Router();

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function mapProduct(p: Record<string, unknown>, categoryName?: string | null) {
  const images = typeof p.images === "string" ? JSON.parse(p.images as string) : [];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    shortDescription: p.short_description ?? p.shortDescription,
    price: Number(p.price),
    discountPrice: p.discount_price != null ? Number(p.discount_price) : (p.discountPrice != null ? Number(p.discountPrice) : null),
    categoryId: p.category_id ?? p.categoryId ?? null,
    categoryName: categoryName ?? null,
    images,
    stock: Number(p.stock),
    featured: Boolean(p.featured),
    referralCode: p.referral_code ?? p.referralCode ?? null,
    averageRating: p.averageRating != null ? Number(p.averageRating) : null,
    reviewCount: Number(p.reviewCount ?? 0),
    createdAt: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at ?? p.createdAt ?? ""),
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, featured, limit = 50, offset = 0 } = req.query;
    let rows = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        shortDescription: productsTable.shortDescription,
        price: productsTable.price,
        discountPrice: productsTable.discountPrice,
        categoryId: productsTable.categoryId,
        images: productsTable.images,
        stock: productsTable.stock,
        featured: productsTable.featured,
        referralCode: productsTable.referralCode,
        createdAt: productsTable.createdAt,
        categoryName: categoriesTable.name,
        averageRating: sql<number>`COALESCE(AVG(${reviewsTable.rating}), NULL)`,
        reviewCount: sql<number>`COUNT(${reviewsTable.id})`,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(reviewsTable, eq(reviewsTable.productId, productsTable.id))
      .groupBy(productsTable.id, categoriesTable.name)
      .orderBy(desc(productsTable.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    if (category) {
      rows = rows.filter((r) => r.categoryName?.toLowerCase() === String(category).toLowerCase());
    }
    if (featured !== undefined) {
      rows = rows.filter((r) => r.featured === (featured === "true"));
    }

    const products = rows.map((r) => mapProduct(r as unknown as Record<string, unknown>, r.categoryName));
    res.json({ products, total: products.length });
  } catch (err) {
    req.log.error({ err }, "List products error");
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, description, shortDescription, price, discountPrice, categoryId, images, stock, featured, referralCode } = req.body;
    const slug = slugify(name) + "-" + Date.now();
    const [product] = await db.insert(productsTable).values({
      name,
      slug,
      description,
      shortDescription,
      price: String(price),
      discountPrice: discountPrice ? String(discountPrice) : null,
      categoryId: categoryId || null,
      images: JSON.stringify(images || []),
      stock: Number(stock),
      featured: Boolean(featured),
      referralCode: referralCode || null,
    }).returning();
    res.status(201).json(mapProduct(product as unknown as Record<string, unknown>));
  } catch (err) {
    req.log.error({ err }, "Create product error");
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        shortDescription: productsTable.shortDescription,
        price: productsTable.price,
        discountPrice: productsTable.discountPrice,
        categoryId: productsTable.categoryId,
        images: productsTable.images,
        stock: productsTable.stock,
        featured: productsTable.featured,
        referralCode: productsTable.referralCode,
        createdAt: productsTable.createdAt,
        categoryName: categoriesTable.name,
        averageRating: sql<number>`COALESCE(AVG(${reviewsTable.rating}), NULL)`,
        reviewCount: sql<number>`COUNT(${reviewsTable.id})`,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(reviewsTable, eq(reviewsTable.productId, productsTable.id))
      .where(eq(productsTable.id, id))
      .groupBy(productsTable.id, categoriesTable.name)
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, id)).orderBy(desc(reviewsTable.createdAt));
    const related = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        shortDescription: productsTable.shortDescription,
        price: productsTable.price,
        discountPrice: productsTable.discountPrice,
        categoryId: productsTable.categoryId,
        images: productsTable.images,
        stock: productsTable.stock,
        featured: productsTable.featured,
        referralCode: productsTable.referralCode,
        createdAt: productsTable.createdAt,
        categoryName: categoriesTable.name,
        averageRating: sql<number>`COALESCE(AVG(${reviewsTable.rating}), NULL)`,
        reviewCount: sql<number>`COUNT(${reviewsTable.id})`,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(reviewsTable, eq(reviewsTable.productId, productsTable.id))
      .where(ne(productsTable.id, id))
      .groupBy(productsTable.id, categoriesTable.name)
      .limit(4);

    const product = mapProduct(row as unknown as Record<string, unknown>, row.categoryName);
    res.json({
      ...product,
      reviews: reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        reviewerName: r.reviewerName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      relatedProducts: related.map((r) => mapProduct(r as unknown as Record<string, unknown>, r.categoryName)),
    });
  } catch (err) {
    req.log.error({ err }, "Get product error");
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, description, shortDescription, price, discountPrice, categoryId, images, stock, featured, referralCode } = req.body;
    const [product] = await db.update(productsTable).set({
      name,
      description,
      shortDescription,
      price: String(price),
      discountPrice: discountPrice ? String(discountPrice) : null,
      categoryId: categoryId || null,
      images: JSON.stringify(images || []),
      stock: Number(stock),
      featured: Boolean(featured),
      referralCode: referralCode || null,
    }).where(eq(productsTable.id, id)).returning();
    res.json(mapProduct(product as unknown as Record<string, unknown>));
  } catch (err) {
    req.log.error({ err }, "Update product error");
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete product error");
    res.status(500).json({ error: "Failed to delete product" });
  }
});

router.get("/:id/reviews", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, id)).orderBy(desc(reviewsTable.createdAt));
    res.json(reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      reviewerName: r.reviewerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Get reviews error");
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/:id/reviews", async (req: Request, res: Response) => {
  try {
    const productId = Number(req.params.id);
    const { reviewerName, rating, comment, userId } = req.body;
    const [review] = await db.insert(reviewsTable).values({
      productId,
      reviewerName,
      rating: Number(rating),
      comment,
      userId: userId || null,
    }).returning();
    res.status(201).json({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      reviewerName: review.reviewerName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create review error");
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;
