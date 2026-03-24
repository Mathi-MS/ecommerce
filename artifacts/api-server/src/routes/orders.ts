import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, Order, OrderItem, CartItem, Product, ReferralCode } from "@workspace/db";

const router: IRouter = Router();

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

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 });
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

    const cartItems = await CartItem.find({ sessionId }).populate("productId");
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
      await OrderItem.create({
        orderId: order._id,
        productId: p._id,
        productName: p.name,
        productImage: p.images?.[0] || "",
        price: p.discountPrice ?? p.price,
        quantity: item.quantity,
      });
    }

    await CartItem.deleteMany({ sessionId });

    let razorpayOrder = null;
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = (await import("razorpay")).default;
        const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
        const rOrder = await razorpay.orders.create({ amount: Math.round(total * 100), currency: "INR", receipt: `order_${order._id}` });
        order.razorpayOrderId = rOrder.id;
        await order.save();
        razorpayOrder = { id: rOrder.id, amount: total, currency: "INR" };
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
