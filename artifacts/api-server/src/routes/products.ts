import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, Product, Review, Category } from "@workspace/db";
import mongoose from "mongoose";

const router: IRouter = Router();

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function mapProduct(p: any, categoryName?: string | null) {
  const reviews = await Review.find({ productId: p._id });
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviewCount : null;
  return {
    id: p._id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    shortDescription: p.shortDescription,
    price: p.price,
    discountPrice: p.discountPrice ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: categoryName ?? null,
    images: p.images,
    stock: p.stock,
    featured: p.featured,
    referralCode: p.referralCode ?? null,
    averageRating,
    reviewCount,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { category, featured, limit = 50, offset = 0 } = req.query;
    const filter: any = {};
    if (featured !== undefined) filter.featured = featured === "true";

    let products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate("categoryId");

    if (category) {
      products = products.filter((p: any) => p.categoryId?.name?.toLowerCase() === String(category).toLowerCase());
    }

    const result = await Promise.all(products.map((p: any) => mapProduct(p, p.categoryId?.name)));
    res.json({ products: result, total: result.length });
  } catch (err) {
    req.log.error({ err }, "List products error");
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { name, description, shortDescription, price, discountPrice, categoryId, images, stock, featured, referralCode } = req.body;
    const slug = slugify(name) + "-" + Date.now();
    const product = await Product.create({
      name, slug, description, shortDescription,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      categoryId: categoryId || undefined,
      images: images || [],
      stock: Number(stock),
      featured: Boolean(featured),
      referralCode: referralCode || undefined,
    });
    res.status(201).json(await mapProduct(product));
  } catch (err) {
    req.log.error({ err }, "Create product error");
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const product = await Product.findById(req.params.id).populate("categoryId");
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const reviews = await Review.find({ productId: product._id }).sort({ createdAt: -1 });
    const related = await Product.find({ _id: { $ne: product._id } }).limit(4).populate("categoryId");

    const mapped = await mapProduct(product, (product as any).categoryId?.name);
    res.json({
      ...mapped,
      reviews: reviews.map((r: any) => ({
        id: r._id,
        productId: r.productId,
        userId: r.userId,
        reviewerName: r.reviewerName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      relatedProducts: await Promise.all(related.map((r: any) => mapProduct(r, r.categoryId?.name))),
    });
  } catch (err) {
    req.log.error({ err }, "Get product error");
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { name, description, shortDescription, price, discountPrice, categoryId, images, stock, featured, referralCode } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name, description, shortDescription,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        categoryId: categoryId || undefined,
        images: images || [],
        stock: Number(stock),
        featured: Boolean(featured),
        referralCode: referralCode || undefined,
      },
      { new: true }
    );
    res.json(await mapProduct(product));
  } catch (err) {
    req.log.error({ err }, "Update product error");
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete product error");
    res.status(500).json({ error: "Failed to delete product" });
  }
});

router.get("/:id/reviews", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews.map((r: any) => ({
      id: r._id,
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
    await connectDB();
    const { reviewerName, rating, comment, userId } = req.body;
    const review = await Review.create({
      productId: req.params.id,
      reviewerName,
      rating: Number(rating),
      comment,
      userId: userId || undefined,
    });
    res.status(201).json({
      id: review._id,
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
