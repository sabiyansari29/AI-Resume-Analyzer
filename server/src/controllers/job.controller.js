import Resume from "../models/resume.model.js";
import Job from "../models/job.model.js";

// ======================================================
// NORMALIZE TEXT
// ======================================================
const normalizeText = (text = "") => {
    return String(text)
        .toLowerCase()
        .replace(/[^\w+#.\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};


// ======================================================
// GET WORDS
// ======================================================
const getWords = (text = "") => {
    return new Set(
        normalizeText(text)
            .split(" ")
            .filter((word) => word.length >= 2)
    );
};


// ======================================================
// TECHNICAL SKILLS
// ======================================================
const technicalSkills = [
    "javascript",
    "typescript",
    "java",
    "python",
    "c++",
    "c#",
    "html",
    "css",

    "react",
    "react.js",

    "node",
    "node.js",

    "express",
    "express.js",

    "mongodb",
    "mysql",
    "sql",
    "postgresql",

    "tailwind",
    "tailwind css",
    "bootstrap",
    "redux",

    "rest api",
    "rest apis",

    "jwt",
    "authentication",
    "authorization",

    "git",
    "github",

    "mern",
    "mean",

    "flask",
    "django",
    "fastapi",
    "firebase",

    "aws",
    "azure",
    "gcp",

    "docker",
    "kubernetes",
    "jenkins",

    "jest",
    "mocha",

    "machine learning",
    "artificial intelligence",
    "generative ai",
    "ai",
    "openai",
    "groq",

    "opencv",
    "yolo",
    "yolov8",

    "data structures",
    "algorithms",
    "dsa",

    "dbms",
    "operating systems",
    "computer networks",

    "agile",
    "scrum",

    "problem solving",
    "communication",
    "teamwork"
];


// ======================================================
// ESCAPE REGEX
// ======================================================
const escapeRegex = (text = "") => {
    return text.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};


// ======================================================
// FIND SKILLS IN TEXT
// ======================================================
const findSkillsInText = (text = "") => {
    const normalized = normalizeText(text);

    const foundSkills = [];

    for (const skill of technicalSkills) {
        const skillText = normalizeText(skill);

        if (!skillText) {
            continue;
        }

        let found = false;

        if (
            skillText.includes(" ") ||
            skillText.includes(".") ||
            skillText.includes("+") ||
            skillText.includes("#")
        ) {
            found = normalized.includes(skillText);
        } else {
            const regex = new RegExp(
                `\\b${escapeRegex(skillText)}\\b`,
                "i"
            );

            found = regex.test(normalized);
        }

        if (found) {
            foundSkills.push(skill);
        }
    }

    return foundSkills;
};


// ======================================================
// GET JOB TEXT
// ======================================================
const getJobText = (job) => {
    const requiredSkillNames =
        job.requiredSkills
            ?.map((skill) => {
                if (typeof skill === "string") {
                    return skill;
                }

                return skill?.name || "";
            })
            .join(" ") || "";

    return [
        job.title,
        job.company,
        job.description,
        job.location,
        job.jobType,
        requiredSkillNames
    ]
        .filter(Boolean)
        .join(" ");
};


// ======================================================
// ROLE DEFINITIONS
// ======================================================
const roleDefinitions = [
    {
        keywords: ["mern", "react", "node", "express", "mongodb"],
        title: "MERN Developer"
    },
    {
        keywords: ["react", "javascript"],
        title: "React Developer"
    },
    {
        keywords: ["node", "express", "javascript"],
        title: "Node.js Developer"
    },
    {
        keywords: ["python", "django"],
        title: "Python Developer"
    },
    {
        keywords: ["python", "flask"],
        title: "Python Developer"
    },
    {
        keywords: ["java"],
        title: "Java Developer"
    },
    {
        keywords: ["machine learning", "python"],
        title: "Machine Learning Engineer"
    },
    {
        keywords: ["artificial intelligence", "python"],
        title: "AI Engineer"
    },
    {
        keywords: ["data structures", "algorithms", "javascript"],
        title: "Software Developer"
    },
    {
        keywords: ["html", "css", "javascript"],
        title: "Frontend Developer"
    },
    {
        keywords: ["aws", "docker", "kubernetes"],
        title: "DevOps Engineer"
    },
    {
        keywords: ["sql", "python"],
        title: "Data Analyst"
    }
];


// ======================================================
// GET ROLE SEARCH TERMS
// ======================================================
const getRoleSearchTerms = (resumeText = "") => {
    const text = normalizeText(resumeText);

    const matchedRoles = [];

    for (const role of roleDefinitions) {
        const matchCount = role.keywords.filter(
            (keyword) =>
                text.includes(normalizeText(keyword))
        ).length;

        if (matchCount > 0) {
            matchedRoles.push({
                title: role.title,
                score: matchCount
            });
        }
    }

    matchedRoles.sort(
        (a, b) => b.score - a.score
    );

    const uniqueRoles = [];

    for (const role of matchedRoles) {
        if (!uniqueRoles.includes(role.title)) {
            uniqueRoles.push(role.title);
        }
    }

    if (uniqueRoles.length === 0) {
        uniqueRoles.push("Software Developer");
    }

    return uniqueRoles.slice(0, 3);
};


// ======================================================
// CALCULATE JOB RELEVANCE
// ======================================================
const calculateJobRelevance = (resumeText, job) => {
    const resumeNormalized = normalizeText(resumeText);
    const jobNormalized = normalizeText(getJobText(job));

    const resumeWords = getWords(resumeNormalized);
    const jobWords = getWords(jobNormalized);

    if (
        resumeWords.size === 0 ||
        jobWords.size === 0
    ) {
        return {
            percentage: 0,
            matchedSkills: [],
            missingSkills: []
        };
    }

    // RESUME SKILLS
    const resumeSkills = findSkillsInText(
        resumeNormalized
    );

    // JOB SKILLS
    const jobSkills = findSkillsInText(
        jobNormalized
    );

    const uniqueResumeSkills = [
        ...new Set(
            resumeSkills.map((skill) =>
                normalizeText(skill)
            )
        )
    ];

    const uniqueJobSkills = [
        ...new Set(
            jobSkills.map((skill) =>
                normalizeText(skill)
            )
        )
    ];

    // MATCHED SKILLS
    const matchedSkills =
        uniqueResumeSkills.filter((skill) =>
            uniqueJobSkills.includes(skill)
        );

    // MISSING SKILLS
    const missingSkills =
        uniqueJobSkills.filter(
            (skill) =>
                !uniqueResumeSkills.includes(skill)
        );

    // SKILL SCORE
    const skillScore =
        uniqueJobSkills.length > 0
            ? (
                matchedSkills.length /
                uniqueJobSkills.length
            ) * 100
            : 0;

    // GENERAL KEYWORD SCORE
    let commonWords = 0;

    for (const word of jobWords) {
        if (resumeWords.has(word)) {
            commonWords++;
        }
    }

    const keywordScore =
        jobWords.size > 0
            ? (
                commonWords /
                jobWords.size
            ) * 100
            : 0;

    // TITLE SCORE
    const titleWords = getWords(job.title || "");

    let titleMatches = 0;

    for (const word of titleWords) {
        if (resumeWords.has(word)) {
            titleMatches++;
        }
    }

    const titleScore =
        titleWords.size > 0
            ? (
                titleMatches /
                titleWords.size
            ) * 100
            : 0;

    // ROLE SCORE
    const resumeRoles = getRoleSearchTerms(
        resumeText
    );

    const jobTitle = normalizeText(
        job.title || ""
    );

    let roleScore = 0;

    for (const role of resumeRoles) {
        const roleTitleWords = getWords(
            role.title
        );

        if (roleTitleWords.size === 0) {
            continue;
        }

        let matchedRoleWords = 0;

        for (const word of roleTitleWords) {
            if (jobTitle.includes(word)) {
                matchedRoleWords++;
            }
        }

        const currentScore =
            (
                matchedRoleWords /
                roleTitleWords.size
            ) * 100;

        roleScore = Math.max(
            roleScore,
            currentScore
        );
    }

    // FINAL SCORE
    let finalScore =
        skillScore * 0.60 +
        titleScore * 0.20 +
        keywordScore * 0.10 +
        roleScore * 0.10;

    if (uniqueJobSkills.length === 0) {
        finalScore =
            titleScore * 0.50 +
            keywordScore * 0.30 +
            roleScore * 0.20;
    }

    finalScore = Math.round(
        Math.min(
            100,
            Math.max(0, finalScore)
        )
    );

    return {
        percentage: finalScore,
        matchedSkills,
        missingSkills
    };
};


// ======================================================
// MATCH RESUME WITH MONGODB JOBS
// ======================================================
export const matchJobs = async (req, res) => {
    try {
        const { resumeId } = req.params;

        // ==================================================
        // FIND USER RESUME
        // ==================================================
        const resume = await Resume.findOne({
            _id: resumeId,
            user: req.user.userId
        });

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }

        // ==================================================
        // CHECK RESUME TEXT
        // ==================================================
        if (
            !resume.resumeText ||
            resume.resumeText.trim() === ""
        ) {
            return res.status(400).json({
                message:
                    "Resume text is not available for job matching"
            });
        }

        // ==================================================
        // GET ONLY 5 JOBS FROM MONGODB
        // ==================================================
        const jobs = await Job.find({})
            .populate("requiredSkills")
            .sort({ createdAt: -1 })
            .limit(5);

        console.log(
            `Found ${jobs.length} jobs in MongoDB`
        );

        // ==================================================
        // NO JOBS
        // ==================================================
        if (jobs.length === 0) {
            return res.status(200).json({
                message:
                    "No jobs available in database",
                resumeId,
                totalJobs: 0,
                jobs: [],
                source: "MongoDB"
            });
        }

        // ==================================================
        // MATCH THE 5 DATABASE JOBS
        // ==================================================
        const matchedJobs = jobs
            .map((job) => {
                const relevance =
                    calculateJobRelevance(
                        resume.resumeText,
                        job
                    );

                return {
                    jobId: job._id,
                    title: job.title || "Untitled Job",
                    company:
                        job.company || "Unknown Company",

                    description:
                        job.description || "",

                    location:
                        job.location || "Remote",

                    jobType:
                        job.jobType || "Full-time",

                    experience:
                        job.experience || "",

                    postedDate:
                        job.postedDate ||
                        job.createdAt ||
                        null,

                    requiredSkills:
                        job.requiredSkills || [],

                    applyUrl:
                        job.applyUrl || "",

                    matchedSkills:
                        relevance.matchedSkills,

                    missingSkills:
                        relevance.missingSkills,

                    matchPercentage:
                        relevance.percentage,

                    source: "MongoDB"
                };
            })
            .sort(
                (a, b) =>
                    b.matchPercentage -
                    a.matchPercentage
            );

        // ==================================================
        // RESPONSE
        // ==================================================
        return res.status(200).json({
            message:
                "Jobs matched successfully from MongoDB",

            resumeId,

            totalJobs:
                matchedJobs.length,

            jobs:
                matchedJobs,

            source:
                "MongoDB"
        });

    } catch (error) {
        console.error(
            "Database job matching error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to find matching jobs",

            error:
                error.message
        });
    }
};