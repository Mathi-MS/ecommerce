import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, Order } from "../db/index.js";
import crypto from "crypto";

const router: IRouter = Router();
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { amount, currency = "INR" } = req.body;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      res.status(200).json({ id: "mock_order_" + Date.now(), amount, currency, key: "mock_key" });
      return;
    }
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({ amount: Math.round(Number(amount) * 100), currency });
    res.json({ id: order.id, amount: Number(amount), currency, key: RAZORPAY_KEY_ID });
  } catch (err) {
    req.log.error({ err }, "Create payment order error");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    if (RAZORPAY_KEY_SECRET) {
      const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      if (expected !== razorpay_signature) {
        res.status(400).json({ error: "Invalid payment signature" }); return;
      }
    }
    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: "paid", paymentId: razorpay_payment_id, status: "confirmed" },
      { new: true }
    );
    res.json({
      success: true,
      order: { id: order!._id, status: order!.status, paymentStatus: order!.paymentStatus, total: order!.total, createdAt: order!.createdAt.toISOString() },
    });
  } catch (err) {
    req.log.error({ err }, "Verify payment error");
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

export default router;
