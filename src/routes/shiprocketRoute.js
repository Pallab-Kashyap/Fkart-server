import { Router } from "express";
import { shiprocketWebhook } from "../controllers/shiprocketController.js";

const router = Router();

router.post('/webhook', shiprocketWebhook);

export default router