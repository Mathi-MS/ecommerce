import { Router, type IRouter, type Request, type Response } from "express";
import { connectDB, Faq } from "@workspace/db";

const router: IRouter = Router();

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
    const faq = await Faq.create({ question, answer, order: Number(order) });
    res.status(201).json({ id: faq._id, question: faq.question, answer: faq.answer, order: faq.order });
  } catch (err) {
    req.log.error({ err }, "Create FAQ error");
    res.status(500).json({ error: "Failed to create FAQ item" });
  }
});

export default router;
