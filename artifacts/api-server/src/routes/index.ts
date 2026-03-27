import { Router, type IRouter } from "express";
import healthRouter from "./health";
import auth from "./auth";
import products from "./products";
import categories from "./categories";
import banners from "./banners";
import about from "./about";
import homeSections from "./home-sections";
import cart from "./cart";
import orders from "./orders";
import referrals from "./referrals";
import faq from "./faq";
import offers from "./offers";
import admin from "./admin";
import payment from "./payment";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", auth);
router.use("/products", products);
router.use("/categories", categories);
router.use("/banners", banners);
router.use("/about", about);
router.use("/home-sections", homeSections);
router.use("/cart", cart);
router.use("/orders", orders);
router.use("/referrals", referrals);
router.use("/faq", faq);
router.use("/offers", offers);
router.use("/admin", admin);
router.use("/payment", payment);

export default router;
