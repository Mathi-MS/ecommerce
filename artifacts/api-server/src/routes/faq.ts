import { Router, type IRouter, type Request, type Response } from "express";
import { db, faqTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const faqs = await db.select().from(faqTable).orderBy(asc(faqTable.order));
    res.json(faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      order: f.order,
    })));
  } catch (err) {
    req.log.error({ err }, "List FAQ error");
    res.status(500).json({ error: "Failed to fetch FAQ" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { question, answer, order } = req.body;
    const [faq] = await db.insert(faqTable).values({ question, answer, order: Number(order) }).returning();
    res.status(201).json({ id: faq.id, question: faq.question, answer: faq.answer, order: faq.order });
  } catch (err) {
    req.log.error({ err }, "Create FAQ error");
    res.status(500).json({ error: "Failed to create FAQ item" });
  }
});

export default router;
