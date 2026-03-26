import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, CartItem, Product } from "../db/index.js";
import jwt from "jsonwebtoken";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "elowell-secret-key-2024";

// Middleware to get user from token (optional)
function getUser(req: Request) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

async function buildCart(sessionId: string, userId?: string) {
  const filter: any = userId ? { userId } : { sessionId };
  const items = await CartItem.find(filter).populate("productId");
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
      userId: i.userId,
    };
  });
  const total = cartItems.reduce((sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity, 0);
  return { items: cartItems, total, itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0) };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { sessionId } = req.query;
    const user = getUser(req);
    
    if (!sessionId && !user) {
      res.status(400).json({ error: "sessionId required for guest users" });
      return;
    }
    
    res.json(await buildCart(String(sessionId), user?.userId));
  } catch (err) {
    req.log.error({ err }, "Get cart error");
    res.status(500).json({ error: "Failed to get cart" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { productId, quantity, sessionId } = req.body;
    const user = getUser(req);
    
    // Check product stock
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    
    const filter: any = user ? { userId: user.userId, productId } : { sessionId, productId };
    const existing = await CartItem.findOne(filter);
    const currentCartQuantity = existing ? existing.quantity : 0;
    const newTotalQuantity = currentCartQuantity + Number(quantity);
    
    if (newTotalQuantity > product.stock) {
      res.status(400).json({ 
        error: `Insufficient stock. Available: ${product.stock}, In cart: ${currentCartQuantity}, Requested: ${quantity}` 
      });
      return;
    }
    
    if (existing) {
      existing.quantity = newTotalQuantity;
      await existing.save();
    } else {
      await CartItem.create({ 
        sessionId: user ? undefined : sessionId, 
        userId: user?.userId,
        productId, 
        quantity: Number(quantity) 
      });
    }
    
    res.json(await buildCart(sessionId, user?.userId));
  } catch (err) {
    req.log.error({ err }, "Add to cart error");
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// Migrate guest cart to user cart on login
router.post("/migrate", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { sessionId } = req.body;
    const user = getUser(req);
    
    if (!user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    
    if (!sessionId) {
      res.json({ message: "No guest cart to migrate" });
      return;
    }
    
    // Get guest cart items
    const guestItems = await CartItem.find({ sessionId });
    
    for (const guestItem of guestItems) {
      const existingUserItem = await CartItem.findOne({ 
        userId: user.userId, 
        productId: guestItem.productId 
      });
      
      if (existingUserItem) {
        // Merge quantities
        existingUserItem.quantity += guestItem.quantity;
        await existingUserItem.save();
      } else {
        // Move to user cart
        guestItem.userId = user.userId;
        guestItem.sessionId = undefined;
        await guestItem.save();
      }
    }
    
    // Remove any remaining guest items
    await CartItem.deleteMany({ sessionId });
    
    res.json(await buildCart("", user.userId));
  } catch (err) {
    req.log.error({ err }, "Cart migration error");
    res.status(500).json({ error: "Failed to migrate cart" });
  }
});

router.put("/:itemId", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { quantity, sessionId } = req.body;
    const user = getUser(req);
    
    if (quantity <= 0) {
      await CartItem.findByIdAndDelete(req.params.itemId);
    } else {
      // Check stock when updating quantity
      const cartItem = await CartItem.findById(req.params.itemId);
      if (cartItem) {
        const product = await Product.findById(cartItem.productId);
        if (product && quantity > product.stock) {
          res.status(400).json({ 
            error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}` 
          });
          return;
        }
      }
      await CartItem.findByIdAndUpdate(req.params.itemId, { quantity });
    }
    
    res.json(await buildCart(sessionId, user?.userId));
  } catch (err) {
    req.log.error({ err }, "Update cart error");
    res.status(500).json({ error: "Failed to update cart" });
  }
});

router.delete("/:itemId", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { sessionId } = req.body;
    const user = getUser(req);
    
    await CartItem.findByIdAndDelete(req.params.itemId);
    res.json(await buildCart(sessionId, user?.userId));
  } catch (err) {
    req.log.error({ err }, "Remove from cart error");
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

export default router;
