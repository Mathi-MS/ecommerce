import { Router, type IRouter, type Request, type Response } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable, referralCodesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

async function buildOrderResponse(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  return {
    id: order.id,
    userId: order.userId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    address: order.address,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentId: order.paymentId,
    referralCode: order.referralCode,
    createdAt: order.createdAt.toISOString(),
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage,
      price: Number(i.price),
      quantity: i.quantity,
    })),
  };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const result = await Promise.all(orders.map(buildOrderResponse));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "List orders error");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { customerName, customerEmail, customerPhone, address, city, state, pincode, sessionId, userId, referralCode } = req.body;

    const cartItems = await db
      .select({
        id: cartItemsTable.id,
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

    if (cartItems.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    let subtotal = 0;
    for (const item of cartItems) {
      const effectivePrice = item.discountPrice ? Number(item.discountPrice) : Number(item.price);
      subtotal += effectivePrice * item.quantity;
    }

    let discount = 0;
    let appliedReferral: string | null = null;
    if (referralCode) {
      const [refCode] = await db.select().from(referralCodesTable).where(eq(referralCodesTable.code, referralCode)).limit(1);
      if (refCode && refCode.isActive) {
        discount = (subtotal * Number(refCode.discountPercent)) / 100;
        appliedReferral = referralCode;
        await db.update(referralCodesTable).set({ usageCount: refCode.usageCount + 1 }).where(eq(referralCodesTable.id, refCode.id));
      }
    }

    const total = subtotal - discount;

    const [order] = await db.insert(ordersTable).values({
      userId: userId || null,
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      state,
      pincode,
      subtotal: String(subtotal),
      discount: String(discount),
      total: String(total),
      referralCode: appliedReferral,
      status: "pending",
      paymentStatus: "pending",
    }).returning();

    for (const item of cartItems) {
      const images = typeof item.productImage === "string" ? JSON.parse(item.productImage) : [];
      await db.insert(orderItemsTable).values({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        productImage: images[0] || "",
        price: item.discountPrice ? String(item.discountPrice) : String(item.price),
        quantity: item.quantity,
      });
    }

    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

    let razorpayOrder = null;
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = (await import("razorpay")).default;
        const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
        const rOrder = await razorpay.orders.create({
          amount: Math.round(total * 100),
          currency: "INR",
          receipt: `order_${order.id}`,
        });
        await db.update(ordersTable).set({ razorpayOrderId: rOrder.id }).where(eq(ordersTable.id, order.id));
        razorpayOrder = { id: rOrder.id, amount: total, currency: "INR" };
      } catch (payErr) {
        req.log.warn({ payErr }, "Razorpay order creation failed, continuing without payment");
      }
    }

    const orderResponse = await buildOrderResponse(order);
    res.status(201).json({ order: orderResponse, razorpayOrder });
  } catch (err) {
    req.log.error({ err }, "Create order error");
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(await buildOrderResponse(order));
  } catch (err) {
    req.log.error({ err }, "Get order error");
    res.status(500).json({ error: "Failed to get order" });
  }
});

router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
    res.json(await buildOrderResponse(order));
  } catch (err) {
    req.log.error({ err }, "Update order status error");
    res.status(500).json({ error: "Failed to update order" });
  }
});

export default router;
