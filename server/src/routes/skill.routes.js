import express from "express";

import {
    createSkill,
    getAllSkills
} from "../controllers/skill.controller.js";

import { protect } from "../middleware/auth.middleware.js";


const router = express.Router();


router.post(
    "/",
    protect,
    createSkill
);


router.get(
    "/",
    protect,
    getAllSkills
);


export default router;