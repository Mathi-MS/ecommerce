import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, ReferralCode } from "@workspace/db";

const router: IRouter = Router();

function mapReferral(r: any) {
  return {
    id: r._id,
    code: r.code,
    discountPercent: r.discountPercent,
    discountAmount: r.discountAmount ?? null,
    isActive: r.isActive,
    usageCount: r.usageCount,
    maxUsage: r.maxUsage ?? null,
    productId: r.productId ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.post("/validate", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { code } = req.body;
    const ref = await ReferralCode.findOne({ code, isActive: true });
    if (!ref) { res.status(404).json({ error: "Invalid or inactive referral code" }); return; }
    if (ref.maxUsage && ref.usageCount >= ref.maxUsage) {
      res.status(404).json({ error: "Referral code usage limit reached" }); return;
    }
    res.json(mapReferral(ref));
  } catch (err) {
    req.log.error({ err }, "Validate referral error");
    res.status(500).json({ error: "Failed to validate referral code" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const refs = await ReferralCode.find();
    res.json(refs.map(mapReferral));
  } catch (err) {
    req.log.error({ err }, "List referrals error");
    res.status(500).json({ error: "Failed to fetch referral codes" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { code, discountPercent, discountAmount, maxUsage, productId } = req.body;
    const ref = await ReferralCode.create({
      code: code.toUpperCase(),
      discountPercent: Number(discountPercent),
      discountAmount: discountAmount ? Number(discountAmount) : undefined,
      maxUsage: maxUsage || undefined,
      productId: productId || undefined,
      isActive: true,
    });
    res.status(201).json(mapReferral(ref));
  } catch (err) {
    req.log.error({ err }, "Create referral error");
    res.status(500).json({ error: "Failed to create referral code" });
  }
});

export default router;
