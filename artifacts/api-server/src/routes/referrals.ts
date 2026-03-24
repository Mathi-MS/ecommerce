import { Router, type IRouter, type Request, type Response } from "express";
import { db, referralCodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function mapReferral(r: typeof referralCodesTable.$inferSelect) {
  return {
    id: r.id,
    code: r.code,
    discountPercent: Number(r.discountPercent),
    discountAmount: r.discountAmount ? Number(r.discountAmount) : null,
    isActive: r.isActive,
    usageCount: r.usageCount,
    maxUsage: r.maxUsage,
    productId: r.productId,
    createdAt: r.createdAt.toISOString(),
  };
}

router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const [ref] = await db.select().from(referralCodesTable).where(eq(referralCodesTable.code, code)).limit(1);
    if (!ref || !ref.isActive) {
      res.status(404).json({ error: "Invalid or inactive referral code" });
      return;
    }
    if (ref.maxUsage && ref.usageCount >= ref.maxUsage) {
      res.status(404).json({ error: "Referral code usage limit reached" });
      return;
    }
    res.json(mapReferral(ref));
  } catch (err) {
    req.log.error({ err }, "Validate referral error");
    res.status(500).json({ error: "Failed to validate referral code" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const refs = await db.select().from(referralCodesTable);
    res.json(refs.map(mapReferral));
  } catch (err) {
    req.log.error({ err }, "List referrals error");
    res.status(500).json({ error: "Failed to fetch referral codes" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { code, discountPercent, discountAmount, maxUsage, productId } = req.body;
    const [ref] = await db.insert(referralCodesTable).values({
      code: code.toUpperCase(),
      discountPercent: String(discountPercent),
      discountAmount: discountAmount ? String(discountAmount) : null,
      maxUsage: maxUsage || null,
      productId: productId || null,
      isActive: true,
    }).returning();
    res.status(201).json(mapReferral(ref));
  } catch (err) {
    req.log.error({ err }, "Create referral error");
    res.status(500).json({ error: "Failed to create referral code" });
  }
});

export default router;
