import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import jobRoutes from "./routes/job.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import aiRoutes from "./routes/ai.routes.js";


const app = express();


app.use(cors());
app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/skill", skillRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/ai", aiRoutes);


app.get("/", (req, res) => {
    res.json({
        message: "AI Resume Analyzer API is running"
    });
});


export default app;