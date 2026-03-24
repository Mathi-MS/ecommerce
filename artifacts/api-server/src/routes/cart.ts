import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, CartItem, Product } from "@workspace/db";

const router: IRouter = Router();

async function buildCart(sessionId: string) {
  const items = await CartItem.find({ sessionId }).populate("productId");
  const cartItems = items.map((i: any) => {
    const p = i.productId;
    return {
      id: i._id,
      productId: p._id,
      productName: p.name,
      productImage: p.images?.[0] || "",
      price: p.price,
      discountPrice: p.discountPrice ?? null,
      quantity: i.quantity,
      sessionId: i.sessionId,
    };
  });
  const total = cartItems.reduce((sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity, 0);
  return { items: cartItems, total, itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0) };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { sessionId } = req.query;
    if (!sessionId) { res.status(400).json({ error: "sessionId required" }); return; }
    res.json(await buildCart(String(sessionId)));
  } catch (err) {
    req.log.error({ err }, "Get cart error");
    res.status(500).json({ error: "Failed to get cart" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { productId, quantity, sessionId } = req.body;
    const existing = await CartItem.findOne({ sessionId, productId });
    if (existing) {
      existing.quantity += Number(quantity);
      await existing.save();
    } else {
      await CartItem.create({ sessionId, productId, quantity: Number(quantity) });
    }
    res.json(await buildCart(sessionId));
  } catch (err) {
    req.log.error({ err }, "Add to cart error");
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.put("/:itemId", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { quantity, sessionId } = req.body;
    if (quantity <= 0) {
      await CartItem.findByIdAndDelete(req.params.itemId);
    } else {
      await CartItem.findByIdAndUpdate(req.params.itemId, { quantity });
    }
    res.json(await buildCart(sessionId));
  } catch (err) {
    req.log.error({ err }, "Update cart error");
    res.status(500).json({ error: "Failed to update cart" });
  }
});

router.delete("/:itemId", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { sessionId } = req.body;
    await CartItem.findByIdAndDelete(req.params.itemId);
    res.json(await buildCart(sessionId));
  } catch (err) {
    req.log.error({ err }, "Remove from cart error");
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

export default router;
