import Resume from "../models/resume.model.js";
import Job from "../models/job.model.js";

// ==========================================
// MATCH JOBS WITH RESUME
// ==========================================
export const matchJobs = async (req, res) => {
    try {
        const { resumeId } = req.params;

        // ==========================================
        // FIND RESUME
        // ==========================================
        const resume = await Resume.findOne({
            _id: resumeId,
            user: req.user.userId
        });

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }

        // ==========================================
        // CHECK RESUME TEXT
        // ==========================================
        if (
            !resume.resumeText ||
            resume.resumeText.trim() === ""
        ) {
            return res.status(400).json({
                message: "Resume text is empty"
            });
        }

        // ==========================================
        // GET ALL JOBS
        // ==========================================
        const jobs = await Job.find()
            .populate("requiredSkills");

        if (jobs.length === 0) {
            return res.status(200).json({
                message: "No jobs available",
                resumeId: resume._id,
                totalJobs: 0,
                jobs: []
            });
        }

        // ==========================================
        // RESUME TEXT
        // ==========================================
        const resumeText =
            resume.resumeText.toLowerCase();

        // ==========================================
        // MATCH EVERY JOB
        // ==========================================
        const matchedJobs = jobs.map((job) => {

            const matchedSkills = [];
            const missingSkills = [];

            const requiredSkills =
                job.requiredSkills || [];

            // ==========================================
            // CHECK REQUIRED SKILLS
            // ==========================================
            requiredSkills.forEach((skill) => {

                const skillName =
                    skill.name?.toLowerCase() || "";

                const aliases =
                    Array.isArray(skill.aliases)
                        ? skill.aliases.map((alias) =>
                            alias.toLowerCase()
                        )
                        : [];

                const allSkillNames = [
                    skillName,
                    ...aliases
                ];

                const isMatched =
                    allSkillNames.some(
                        (name) =>
                            name &&
                            resumeText.includes(name)
                    );

                if (isMatched) {
                    matchedSkills.push(skill.name);
                } else {
                    missingSkills.push(skill.name);
                }
            });

            // ==========================================
            // CALCULATE MATCH PERCENTAGE
            // ==========================================
            let matchPercentage = 0;

            if (requiredSkills.length > 0) {
                matchPercentage = Math.round(
                    (
                        matchedSkills.length /
                        requiredSkills.length
                    ) * 100
                );
            }

            // ==========================================
            // RETURN JOB RESULT
            // ==========================================
            return {
                jobId: job._id,

                title: job.title,

                company: job.company,

                description: job.description,

                location: job.location,

                jobType: job.jobType,

                // ⭐ IMPORTANT
                // Apply URL database se frontend ko bhej rahe hain
                applyUrl: job.applyUrl || "",

                matchPercentage,

                matchedSkills,

                missingSkills
            };
        });

        // ==========================================
        // SORT BY MATCH PERCENTAGE
        // ==========================================
        matchedJobs.sort(
            (a, b) =>
                b.matchPercentage -
                a.matchPercentage
        );

        // ==========================================
        // FINAL RESPONSE
        // ==========================================
        return res.status(200).json({
            message: "Job matching completed",

            resumeId: resume._id,

            totalJobs: matchedJobs.length,

            jobs: matchedJobs
        });

    } catch (error) {

        console.log(
            "Job matching error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to match jobs",
            error: error.message
        });
    }
};