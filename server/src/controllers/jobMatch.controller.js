import Resume from "../models/resume.model.js";
import Job from "../models/job.model.js";

export const matchJobs = async (req, res) => {
  try {
    const { resumeId } = req.params;

    // =========================
    // FIND USER'S RESUME
    // =========================
    const resume = await Resume.findOne({
      _id: resumeId,
      user: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found.",
      });
    }

    if (!resume.resumeText || !resume.resumeText.trim()) {
      return res.status(400).json({
        message: "Resume text is empty. Please upload a valid resume.",
      });
    }

    // =========================
    // RESUME TEXT
    // =========================
    const resumeText = resume.resumeText.toLowerCase();

    // =========================
    // GET ONLY JOBS FROM MONGODB
    // =========================
    // IMPORTANT:
    // No external/India Jobs API is used here.
    // Jobs are taken directly from MongoDB.
    const jobs = await Job.find({})
      .populate("requiredSkills")
      .sort({ createdAt: -1 })
      .limit(5);

    if (!jobs || jobs.length === 0) {
      return res.status(200).json({
        message: "No jobs are available in the database.",
        resumeId,
        totalJobs: 0,
        jobs: [],
      });
    }

    // =========================
    // MATCH MONGODB JOBS
    // =========================
    const matchedJobs = jobs.map((job) => {
      const matchedSkills = [];
      const missingSkills = [];

      const requiredSkills = Array.isArray(job.requiredSkills)
        ? job.requiredSkills
        : [];

      requiredSkills.forEach((skill) => {
        if (!skill) return;

        const skillName =
          skill.name ||
          skill.title ||
          skill.skill ||
          "";

        if (!skillName) return;

        const normalizedSkill = skillName
          .toString()
          .trim()
          .toLowerCase();

        if (!normalizedSkill) return;

        // =========================
        // CHECK SKILL NAME
        // =========================
        const skillMatched =
          resumeText.includes(normalizedSkill);

        // =========================
        // CHECK SKILL ALIASES
        // =========================
        let aliasMatched = false;

        if (Array.isArray(skill.aliases)) {
          aliasMatched = skill.aliases.some((alias) => {
            if (!alias) return false;

            const normalizedAlias = alias
              .toString()
              .trim()
              .toLowerCase();

            return (
              normalizedAlias &&
              resumeText.includes(normalizedAlias)
            );
          });
        }

        // =========================
        // MATCHED / MISSING
        // =========================
        if (skillMatched || aliasMatched) {
          matchedSkills.push(skillName);
        } else {
          missingSkills.push(skillName);
        }
      });

      // =========================
      // MATCH PERCENTAGE
      // =========================
      let matchPercentage = 0;

      if (requiredSkills.length > 0) {
        matchPercentage = Math.round(
          (matchedSkills.length / requiredSkills.length) * 100
        );
      }

      // =========================
      // RETURN JOB
      // =========================
      return {
        jobId: job._id,

        title: job.title || "Untitled Job",

        company: job.company || "Unknown Company",

        description: job.description || "",

        location: job.location || "Remote",

        jobType: job.jobType || "Full-time",

        experience: job.experience || "",

        postedDate:
          job.postedDate ||
          job.createdAt ||
          null,

        applyUrl:
          job.applyUrl ||
          job.applicationUrl ||
          job.apply_link ||
          job.url ||
          "",

        matchPercentage,

        matchedSkills,

        missingSkills,
      };
    });

    // =========================
    // SORT BY MATCH PERCENTAGE
    // =========================
    matchedJobs.sort(
      (a, b) =>
        b.matchPercentage - a.matchPercentage
    );

    // =========================
    // RESPONSE
    // =========================
    return res.status(200).json({
      message: "Job matching completed using MongoDB jobs.",
      resumeId,
      totalJobs: matchedJobs.length,
      jobs: matchedJobs,
    });
  } catch (error) {
    console.error("Job matching error:", error);

    return res.status(500).json({
      message: "Failed to match jobs.",
      error: error.message,
    });
  }
};