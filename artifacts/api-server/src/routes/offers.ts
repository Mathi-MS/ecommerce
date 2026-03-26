import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, Offer } from "../db/index.js";

const router: IRouter = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers.map((o: any) => ({ id: o._id, text: o.text, status: o.status, createdAt: o.createdAt })));
  } catch (err) {
    req.log.error({ err }, "List offers error");
    res.status(500).json({ error: "Failed to fetch offers" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { text, status } = req.body;
    const words = text?.trim().split(/\s+/) ?? [];
    if (words.length < 2) { res.status(400).json({ error: "Minimum 2 words required" }); return; }
    if (words.length > 10) { res.status(400).json({ error: "Maximum 10 words allowed" }); return; }
    if (text.length > 200) { res.status(400).json({ error: "Maximum 200 characters allowed" }); return; }
    const offer = await Offer.create({ text: text.trim(), status: status ?? "inactive" });
    res.status(201).json({ id: offer._id, text: offer.text, status: offer.status, createdAt: offer.createdAt });
  } catch (err) {
    req.log.error({ err }, "Create offer error");
    res.status(500).json({ error: "Failed to create offer" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    console.log("[PUT /offers/:id] id=", req.params.id, "body=", req.body);
    const { text, status } = req.body;
    if (text !== undefined) {
      const words = text?.trim().split(/\s+/) ?? [];
      if (words.length < 2) { res.status(400).json({ error: "Minimum 2 words required" }); return; }
      if (words.length > 10) { res.status(400).json({ error: "Maximum 10 words allowed" }); return; }
      if (text.length > 200) { res.status(400).json({ error: "Maximum 200 characters allowed" }); return; }
    }
    if (status === "active") {
      const r = await Offer.updateMany({}, { $set: { status: "inactive" } });
      console.log("[PUT /offers/:id] updateMany result=", JSON.stringify(r));
    }
    const offer = await Offer.findByIdAndUpdate(req.params.id, { ...(text !== undefined && { text: text.trim() }), ...(status !== undefined && { status }) }, { new: true, runValidators: true });
    if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }
    res.json({ id: offer._id, text: offer.text, status: offer.status, createdAt: offer.createdAt });
  } catch (err) {
    req.log.error({ err }, "Update offer error");
    res.status(500).json({ error: "Failed to update offer" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete offer error");
    res.status(500).json({ error: "Failed to delete offer" });
  }
});

export default router;
