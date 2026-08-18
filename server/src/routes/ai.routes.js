import express from "express";
import { analyzeResumeWithAI } from "../controllers/ai.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/analyze/:resumeId",
    protect,
    analyzeResumeWithAI
);

export default router;