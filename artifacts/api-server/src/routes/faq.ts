import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, Faq } from "@workspace/db";

const router: IRouter = Router();

async function reorder() {
  const faqs = await Faq.find().sort({ order: 1 });
  for (let i = 0; i < faqs.length; i++) {
    if (faqs[i].order !== i + 1) await Faq.findByIdAndUpdate(faqs[i]._id, { order: i + 1 });
  }
}

router.get("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const faqs = await Faq.find().sort({ order: 1 });
    res.json(faqs.map((f: any) => ({ id: f._id, question: f.question, answer: f.answer, order: f.order })));
  } catch (err) {
    req.log.error({ err }, "List FAQ error");
    res.status(500).json({ error: "Failed to fetch FAQ" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { question, answer, order } = req.body;
    const pos = Number(order);
    await Faq.updateMany({ order: { $gte: pos } }, { $inc: { order: 1 } });
    const faq = await Faq.create({ question, answer, order: pos });
    await reorder();
    res.status(201).json({ id: faq._id, question: faq.question, answer: faq.answer, order: faq.order });
  } catch (err) {
    req.log.error({ err }, "Create FAQ error");
    res.status(500).json({ error: "Failed to create FAQ item" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    const { question, answer, order } = req.body;
    if (order !== undefined) {
      const current = await Faq.findById(req.params.id);
      if (current) {
        const newPos = Number(order);
        const oldPos = current.order;
        if (newPos !== oldPos) {
          if (newPos < oldPos) {
            await Faq.updateMany({ _id: { $ne: current._id }, order: { $gte: newPos, $lt: oldPos } }, { $inc: { order: 1 } });
          } else {
            await Faq.updateMany({ _id: { $ne: current._id }, order: { $gt: oldPos, $lte: newPos } }, { $inc: { order: -1 } });
          }
        }
      }
    }
    const faq = await Faq.findByIdAndUpdate(req.params.id, { ...(question !== undefined && { question }), ...(answer !== undefined && { answer }), ...(order !== undefined && { order: Number(order) }) }, { new: true });
    if (!faq) { res.status(404).json({ error: "FAQ not found" }); return; }
    await reorder();
    res.json({ id: faq._id, question: faq.question, answer: faq.answer, order: faq.order });
  } catch (err) {
    req.log.error({ err }, "Update FAQ error");
    res.status(500).json({ error: "Failed to update FAQ item" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await connectDB();
    await Faq.findByIdAndDelete(req.params.id);
    await reorder();
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete FAQ error");
    res.status(500).json({ error: "Failed to delete FAQ item" });
  }
});

export default router;
