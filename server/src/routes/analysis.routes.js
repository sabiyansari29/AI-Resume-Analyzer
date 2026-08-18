import express from "express";

import { analyzeResume } from "../controllers/analysis.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/:resumeId",
    protect,
    analyzeResume
);

export default router;