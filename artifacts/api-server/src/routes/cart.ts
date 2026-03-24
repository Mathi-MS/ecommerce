import { Router, type IRouter, type Request, type Response } from "express";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

async function buildCart(sessionId: string) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      sessionId: cartItemsTable.sessionId,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      productName: productsTable.name,
      productImage: productsTable.images,
      price: productsTable.price,
      discountPrice: productsTable.discountPrice,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.sessionId, sessionId));

  const cartItems = items.map((i) => {
    const images = typeof i.productImage === "string" ? JSON.parse(i.productImage) : [];
    const effectivePrice = i.discountPrice ? Number(i.discountPrice) : Number(i.price);
    return {
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImage: images[0] || "",
      price: Number(i.price),
      discountPrice: i.discountPrice ? Number(i.discountPrice) : null,
      quantity: i.quantity,
      sessionId: i.sessionId,
    };
  });

  const total = cartItems.reduce((sum, item) => {
    const p = item.discountPrice ?? item.price;
    return sum + p * item.quantity;
  }, 0);

  return {
    items: cartItems,
    total,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ error: "sessionId required" });
      return;
    }
    const cart = await buildCart(String(sessionId));
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Get cart error");
    res.status(500).json({ error: "Failed to get cart" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { productId, quantity, sessionId } = req.body;
    const existing = await db
      .select()
      .from(cartItemsTable)
      .where(and(eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      await db.update(cartItemsTable)
        .set({ quantity: existing[0].quantity + Number(quantity) })
        .where(eq(cartItemsTable.id, existing[0].id));
    } else {
      await db.insert(cartItemsTable).values({ sessionId, productId, quantity: Number(quantity) });
    }

    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Add to cart error");
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.put("/:itemId", async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.itemId);
    const { quantity, sessionId } = req.body;
    if (quantity <= 0) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
    } else {
      await db.update(cartItemsTable).set({ quantity }).where(eq(cartItemsTable.id, itemId));
    }
    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Update cart error");
    res.status(500).json({ error: "Failed to update cart" });
  }
});

router.delete("/:itemId", async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.itemId);
    const { sessionId } = req.body;
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
    const cart = await buildCart(sessionId);
    res.json(cart);
  } catch (err) {
    req.log.error({ err }, "Remove from cart error");
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

export default router;
