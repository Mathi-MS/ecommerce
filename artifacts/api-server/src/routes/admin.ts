import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable, productsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "elowell-secret-key-2024";

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || user.role !== "admin") {
      res.status(401).json({ error: "Invalid admin credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid admin credentials" });
      return;
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt.toISOString() },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Admin login error");
    res.status(500).json({ error: "Admin login failed" });
  }
});

router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const [productCount] = await db.select({ count: count() }).from(productsTable);
    const [orderCount] = await db.select({ count: count() }).from(ordersTable);
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [revenueResult] = await db.select({ total: sum(ordersTable.total) }).from(ordersTable).where(eq(ordersTable.paymentStatus, "paid"));
    const [pendingCount] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.status, "pending"));

    const recentOrderRows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);
    const recentOrders = await Promise.all(recentOrderRows.map(async (order) => {
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
    }));

    res.json({
      totalProducts: productCount.count,
      totalOrders: orderCount.count,
      totalRevenue: Number(revenueResult?.total ?? 0),
      totalUsers: userCount.count,
      recentOrders,
      pendingOrders: pendingCount.count,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard error");
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
