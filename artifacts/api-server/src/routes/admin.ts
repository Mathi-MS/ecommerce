import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB, User, Product, Order, OrderItem } from "@workspace/db";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "elowell-secret-key-2024";

router.post("/login", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "admin" });
    if (!user) { res.status(401).json({ error: "Invalid admin credentials" }); return; }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ error: "Invalid admin credentials" }); return; }
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Admin login error");
    res.status(500).json({ error: "Admin login failed" });
  }
});

router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const [totalProducts, totalOrders, totalUsers, pendingOrders] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.countDocuments({ status: "pending" }),
    ]);

    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total ?? 0;

    const recentOrderDocs = await Order.find().sort({ createdAt: -1 }).limit(10);
    const recentOrders = await Promise.all(recentOrderDocs.map(async (order: any) => {
      const items = await OrderItem.find({ orderId: order._id });
      return {
        id: order._id,
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
    }));

    res.json({ totalProducts, totalOrders, totalRevenue, totalUsers, recentOrders, pendingOrders });
  } catch (err) {
    req.log.error({ err }, "Dashboard error");
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
