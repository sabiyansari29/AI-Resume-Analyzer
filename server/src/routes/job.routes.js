import express from "express";

import {
    createJob,
    getJobs,
    getJobById,
    updateJob,
    deleteJob
} from "../controllers/job.controller.js";

import {
    matchJobs
} from "../controllers/jobMatch.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();


// ==========================================
// JOB MATCHING
// ==========================================
router.get(
    "/match/:resumeId",
    authMiddleware,
    matchJobs
);


// ==========================================
// CREATE JOB
// ==========================================
router.post(
    "/",
    authMiddleware,
    createJob
);


// ==========================================
// GET ALL JOBS
// ==========================================
router.get(
    "/",
    authMiddleware,
    getJobs
);


// ==========================================
// GET SINGLE JOB
// ==========================================
router.get(
    "/:id",
    authMiddleware,
    getJobById
);


// ==========================================
// UPDATE JOB
// ==========================================
router.put(
    "/:id",
    authMiddleware,
    updateJob
);


// ==========================================
// DELETE JOB
// ==========================================
router.delete(
    "/:id",
    authMiddleware,
    deleteJob
);

export default router;