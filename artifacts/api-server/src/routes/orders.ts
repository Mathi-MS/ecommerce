import { Router, type IRouter, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { connectDB, Order, OrderItem, CartItem, Product, ReferralCode } from "../db/index.js";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "elowell-secret-key-2024";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

async function buildOrderResponse(order: any) {
  const items = await OrderItem.find({ orderId: order._id });
  return {
    id: order._id,
    userId: order.userId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    address: order.address,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentId: order.paymentId,
    referralCode: order.referralCode,
    createdAt: order.createdAt.toISOString(),
    items: items.map((i: any) => ({
      id: i._id,
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage,
      price: i.price,
      quantity: i.quantity,
    })),
  };
}

router.get("/user", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const orders = await Order.find({ userId: decoded.userId }).sort({ createdAt: -1 });
    res.json(await Promise.all(orders.map(buildOrderResponse)));
  } catch (err) {
    req.log.error({ err }, "Get user orders error");
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { status, search, userId } = req.query;
    const filter: any = {};
    
    // If userId is provided, filter by user (for customer order history)
    if (userId) {
      filter.userId = userId;
    }
    
    if (status && status !== "all") filter.status = status;
    if (search) {
      const re = new RegExp(String(search), "i");
      filter.$or = [
        { customerName: re },
        { customerEmail: re },
        { customerPhone: re },
      ];
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(await Promise.all(orders.map(buildOrderResponse)));
  } catch (err) {
    req.log.error({ err }, "List orders error");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { customerName, customerEmail, customerPhone, address, city, state, pincode, sessionId, userId, referralCode } = req.body;

    // Get cart items based on user or session
    const cartFilter: any = userId ? { userId } : { sessionId };
    const cartItems = await CartItem.find(cartFilter).populate("productId");
    if (cartItems.length === 0) { res.status(400).json({ error: "Cart is empty" }); return; }

    let subtotal = 0;
    for (const item of cartItems as any[]) {
      const p = item.productId;
      subtotal += (p.discountPrice ?? p.price) * item.quantity;
    }

    let discount = 0;
    let appliedReferral: string | null = null;
    if (referralCode) {
      const ref = await ReferralCode.findOne({ code: referralCode, isActive: true });
      if (ref) {
        discount = (subtotal * ref.discountPercent) / 100;
        appliedReferral = referralCode;
        ref.usageCount += 1;
        await ref.save();
      }
    }

    const total = subtotal - discount;
    const order = await Order.create({
      userId: userId || undefined,
      customerName, customerEmail, customerPhone, address, city, state, pincode,
      subtotal, discount, total,
      referralCode: appliedReferral,
      status: "pending",
      paymentStatus: "pending",
    });

    for (const item of cartItems as any[]) {
      const p = item.productId;
      
      // Check stock availability
      if (p.stock < item.quantity) {
        res.status(400).json({ error: `Insufficient stock for ${p.name}. Available: ${p.stock}, Requested: ${item.quantity}` });
        return;
      }
      
      // Reduce stock
      await Product.findByIdAndUpdate(p._id, {
        $inc: { stock: -item.quantity }
      });
      
      await OrderItem.create({
        orderId: order._id,
        productId: p._id,
        productName: p.name,
        productImage: p.images?.[0] || "",
        price: p.discountPrice ?? p.price,
        quantity: item.quantity,
      });
    }

    // Clear cart after successful order
    await CartItem.deleteMany(cartFilter);

    let razorpayOrder = null;
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = (await import("razorpay")).default;
        const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
        const rOrder = await razorpay.orders.create({ amount: Math.round(total * 100), currency: "USD", receipt: `order_${order._id}` });
        order.razorpayOrderId = rOrder.id;
        await order.save();
        razorpayOrder = { id: rOrder.id, amount: total, currency: "USD" };
      } catch (payErr) {
        req.log.warn({ payErr }, "Razorpay order creation failed");
      }
    }

    res.status(201).json({ order: await buildOrderResponse(order), razorpayOrder });
  } catch (err) {
    req.log.error({ err }, "Create order error");
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(await buildOrderResponse(order));
  } catch (err) {
    req.log.error({ err }, "Get order error");
    res.status(500).json({ error: "Failed to get order" });
  }
});

router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(await buildOrderResponse(order));
  } catch (err) {
    req.log.error({ err }, "Update order status error");
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
