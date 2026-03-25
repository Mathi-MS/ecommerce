import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, ReferralCode, Product } from "@workspace/db";

const router: IRouter = Router();

function mapReferral(r: any) {
  return {
    id: r._id,
    code: r.code,
    couponName: r.couponName,
    discountPercent: r.discountPercent,
    discountAmount: r.discountAmount ?? null,
    isActive: r.isActive,
    usageCount: r.usageCount,
    maxUsage: r.maxUsage ?? null,
    productIds: (r.productIds || []).map((id: any) => String(id)),
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
    const { couponName, discountPercent, discountAmount, maxUsage, productIds } = req.body;
    if (!couponName) { res.status(400).json({ error: "Coupon name is required" }); return; }
    const prefix = couponName.replace(/\s+/g, "").substring(0, 3).toUpperCase();
    const code = `${prefix}${Math.round(Number(discountPercent))}`;
    const existing = await ReferralCode.findOne({ code });
    if (existing) { res.status(400).json({ error: `Code ${code} already exists` }); return; }
    if (productIds?.length) {
      const conflict = await ReferralCode.findOne({ productIds: { $in: productIds } });
      if (conflict) { res.status(400).json({ error: `Product already assigned to coupon ${conflict.code}` }); return; }
    }
    const ref = await ReferralCode.create({
      code,
      couponName,
      discountPercent: Number(discountPercent),
      discountAmount: discountAmount ? Number(discountAmount) : undefined,
      maxUsage: maxUsage || undefined,
      productIds: productIds || [],
      isActive: true,
    });
    res.status(201).json(mapReferral(ref));
  } catch (err) {
    req.log.error({ err }, "Create referral error");
    res.status(500).json({ error: "Failed to create referral code" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { couponName, discountPercent, productIds } = req.body;
    // check no other coupon already owns any of these productIds
    if (productIds?.length) {
      const conflict = await ReferralCode.findOne({ _id: { $ne: req.params.id }, productIds: { $in: productIds } });
      if (conflict) { res.status(400).json({ error: `Product already assigned to coupon ${conflict.code}` }); return; }
    }
    const ref = await ReferralCode.findByIdAndUpdate(
      req.params.id,
      { couponName, discountPercent: Number(discountPercent), productIds: productIds || [] },
      { new: true }
    );
    if (!ref) { res.status(404).json({ error: "Coupon not found" }); return; }
    res.json(mapReferral(ref));
  } catch (err) {
    req.log.error({ err }, "Update referral error");
    res.status(500).json({ error: "Failed to update referral code" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    await ReferralCode.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete referral error");
    res.status(500).json({ error: "Failed to delete referral code" });
  }
});

export default router;
