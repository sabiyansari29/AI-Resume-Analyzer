import axios from "axios";
import Resume from "../models/resume.model.js";

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
// SKILLS
// ======================================================
const skills = [
    {
        name: "javascript",
        aliases: ["javascript", "js", "ecmascript"]
    },
    {
        name: "react",
        aliases: ["react", "react.js", "reactjs"]
    },
    {
        name: "node.js",
        aliases: ["node.js", "nodejs", "node js"]
    },
    {
        name: "express.js",
        aliases: ["express.js", "expressjs", "express js"]
    },
    {
        name: "mongodb",
        aliases: ["mongodb", "mongo db", "mongo"]
    },
    {
        name: "mysql",
        aliases: ["mysql", "my sql"]
    },
    {
        name: "sql",
        aliases: ["sql"]
    },
    {
        name: "java",
        aliases: ["java"]
    },
    {
        name: "python",
        aliases: ["python", "python3"]
    },
    {
        name: "c++",
        aliases: ["c++", "cpp"]
    },
    {
        name: "html",
        aliases: ["html", "html5"]
    },
    {
        name: "css",
        aliases: ["css", "css3"]
    },
    {
        name: "tailwind css",
        aliases: ["tailwind css", "tailwind"]
    },
    {
        name: "git",
        aliases: ["git"]
    },
    {
        name: "github",
        aliases: ["github"]
    },
    {
        name: "docker",
        aliases: ["docker"]
    },
    {
        name: "aws",
        aliases: ["aws", "amazon web services"]
    },
    {
        name: "azure",
        aliases: ["azure", "microsoft azure"]
    },
    {
        name: "machine learning",
        aliases: ["machine learning", "machine-learning", "ml"]
    },
    {
        name: "artificial intelligence",
        aliases: [
            "artificial intelligence",
            "artificial-intelligence"
        ]
    },
    {
        name: "data structures",
        aliases: [
            "data structures",
            "data structure"
        ]
    },
    {
        name: "algorithms",
        aliases: ["algorithms", "algorithm"]
    },
    {
        name: "api",
        aliases: [
            "api",
            "apis",
            "application programming interface"
        ]
    },
    {
        name: "rest api",
        aliases: [
            "rest api",
            "rest apis",
            "restful api",
            "restful apis"
        ]
    },
    {
        name: "typescript",
        aliases: ["typescript", "ts"]
    },
    {
        name: "angular",
        aliases: ["angular", "angular.js", "angularjs"]
    },
    {
        name: "spring boot",
        aliases: ["spring boot", "springboot"]
    },
    {
        name: "flask",
        aliases: ["flask"]
    },
    {
        name: "next.js",
        aliases: ["next.js", "nextjs", "next js"]
    },
    {
        name: "jwt",
        aliases: [
            "jwt",
            "json web token",
            "json web tokens"
        ]
    },
    {
        name: "linux",
        aliases: ["linux"]
    },
    {
        name: "communication",
        aliases: [
            "communication",
            "communication skills",
            "verbal communication",
            "written communication"
        ]
    },
    {
        name: "excel",
        aliases: [
            "excel",
            "microsoft excel",
            "ms excel"
        ]
    }
];

// ======================================================
// CHECK WHETHER TEXT CONTAINS SKILL
// ======================================================
const containsSkill = (text, skill) => {
    const normalizedText = normalizeText(text);
    const normalizedSkill = normalizeText(skill);

    if (!normalizedSkill) {
        return false;
    }

    if (normalizedSkill === "c++") {
        return (
            normalizedText.includes("c++") ||
            normalizedText.includes("cpp")
        );
    }

    if (normalizedSkill === "js") {
        return /\bjs\b/i.test(normalizedText);
    }

    if (normalizedSkill === "ts") {
        return /\bts\b/i.test(normalizedText);
    }

    const escapedSkill = normalizedSkill.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    const regex = new RegExp(
        `(^|\\s)${escapedSkill}(?=\\s|$|[.,/+#-])`,
        "i"
    );

    return regex.test(normalizedText);
};

// ======================================================
// FIND SKILLS
// ======================================================
const findSkills = (text) => {
    const foundSkills = [];

    for (const skill of skills) {
        const found = skill.aliases.some((alias) =>
            containsSkill(text, alias)
        );

        if (found) {
            foundSkills.push(skill.name);
        }
    }

    return [...new Set(foundSkills)];
};

// ======================================================
// GET JOB TEXT
// ======================================================
const getJobText = (job) => {
    return [
        job.title,
        job.job_title,
        job.company,
        job.about_company,
        job.job_description,
        job.role_and_responsibility,
        job.education_and_skills,
        job.experience,
        job.location,
        job.job_type
    ]
        .filter(Boolean)
        .join(" ");
};

// ======================================================
// CALCULATE MATCH
// ======================================================
const calculateMatch = (resumeText, job) => {

    const jobText = getJobText(job);

    const resumeSkills = findSkills(resumeText);
    const jobSkills = findSkills(jobText);

    const matchedSkills = resumeSkills.filter(
        (skill) => jobSkills.includes(skill)
    );

    const missingSkills = jobSkills.filter(
        (skill) => !resumeSkills.includes(skill)
    );

    // --------------------------------------------------
    // SKILL SCORE
    // --------------------------------------------------
    let skillScore = 0;

    if (jobSkills.length > 0) {
        skillScore =
            (matchedSkills.length / jobSkills.length) * 100;
    }

    // --------------------------------------------------
    // TITLE SCORE
    // --------------------------------------------------
    const resumeNormalized = normalizeText(resumeText);

    const title = normalizeText(
        `${job.title || ""} ${job.job_title || ""}`
    );

    const titleWords = title
        .split(" ")
        .filter((word) => word.length >= 3);

    let titleMatches = 0;

    for (const word of titleWords) {
        if (resumeNormalized.includes(word)) {
            titleMatches++;
        }
    }

    let titleScore = 0;

    if (titleWords.length > 0) {
        titleScore =
            (titleMatches / titleWords.length) * 100;
    }

    // --------------------------------------------------
    // KEYWORD SCORE
    // --------------------------------------------------
    const resumeWords = new Set(
        resumeNormalized
            .split(/\s+/)
            .filter((word) => word.length >= 3)
    );

    const jobWords = new Set(
        normalizeText(jobText)
            .split(/\s+/)
            .filter((word) => word.length >= 3)
    );

    let commonWords = 0;

    for (const word of jobWords) {
        if (resumeWords.has(word)) {
            commonWords++;
        }
    }

    let keywordScore = 0;

    if (jobWords.size > 0) {
        keywordScore =
            (commonWords / jobWords.size) * 100;
    }

    // --------------------------------------------------
    // FINAL SCORE
    // --------------------------------------------------
    let finalScore;

    if (jobSkills.length > 0) {
        finalScore =
            skillScore * 0.70 +
            titleScore * 0.20 +
            keywordScore * 0.10;
    } else {
        finalScore =
            titleScore * 0.70 +
            keywordScore * 0.30;
    }

    finalScore = Math.round(
        Math.max(
            0,
            Math.min(100, finalScore)
        )
    );

    return {
        matchPercentage: finalScore,
        matchedSkills,
        missingSkills
    };
};

// ======================================================
// GET RESUME LOCATION
// ======================================================
const getResumeLocation = (resumeText) => {

    const text = normalizeText(resumeText);

    const locations = [
        "lucknow",
        "new delhi",
        "delhi",
        "noida",
        "greater noida",
        "gurgaon",
        "gurugram",
        "bangalore",
        "bengaluru",
        "hyderabad",
        "pune",
        "mumbai",
        "chennai",
        "kolkata",
        "ahmedabad",
        "jaipur",
        "kanpur",
        "agra",
        "varanasi",
        "indore",
        "bhopal"
    ];

    for (const location of locations) {
        if (
            text.includes(
                normalizeText(location)
            )
        ) {
            return location;
        }
    }

    return "";
};

// ======================================================
// FETCH LIVE JOBS
// ONLY ONE EXTERNAL API REQUEST
// ======================================================
const fetchLiveJobs = async (resumeText) => {

    const resumeLocation =
        getResumeLocation(resumeText);

    const params = {
        limit: "20"
    };

    if (resumeLocation) {
        params.location = resumeLocation;
    }

    console.log(
        "Fetching live jobs from Indian API..."
    );

    console.log(
        "API parameters:",
        params
    );

    const response = await axios.get(
        "https://jobs.indianapi.in/jobs",
        {
            params,
            headers: {
                "x-api-key":
                    process.env.INDIAN_API_KEY
            },
            timeout: 15000
        }
    );

    return Array.isArray(response.data)
        ? response.data
        : response.data?.jobs || [];
};

// ======================================================
// MATCH JOBS
// ======================================================
export const matchJobs = async (req, res) => {

    try {

        const { resumeId } = req.params;

        // ==================================================
        // AUTH CHECK
        // ==================================================
        if (
            !req.user ||
            !req.user.userId
        ) {
            return res.status(401).json({
                message:
                    "User authentication information not found"
            });
        }

        // ==================================================
        // API KEY CHECK
        // ==================================================
        if (
            !process.env.INDIAN_API_KEY
        ) {
            return res.status(500).json({
                message:
                    "INDIAN_API_KEY is not configured on server"
            });
        }

        // ==================================================
        // FIND RESUME
        // ==================================================
        const resume =
            await Resume.findOne({
                _id: resumeId,
                user: req.user.userId
            });

        if (!resume) {
            return res.status(404).json({
                message:
                    "Resume not found"
            });
        }

        if (
            !resume.resumeText ||
            resume.resumeText.trim() === ""
        ) {
            return res.status(400).json({
                message:
                    "Resume text is empty"
            });
        }

        // ==================================================
        // FETCH LIVE JOBS
        // ==================================================
        const liveJobs =
            await fetchLiveJobs(
                resume.resumeText
            );

        console.log(
            `Indian API returned ${liveJobs.length} jobs`
        );

        // ==================================================
        // NO JOBS
        // ==================================================
        if (!liveJobs.length) {
            return res.status(200).json({
                message:
                    "No live jobs are currently available. Please try again later.",
                resumeId: resume._id,
                totalJobs: 0,
                jobs: []
            });
        }

        // ==================================================
        // REMOVE DUPLICATES
        // ==================================================
        const uniqueJobs = new Map();

        for (const job of liveJobs) {

            const title =
                job.title ||
                job.job_title ||
                "";

            const company =
                job.company ||
                "";

            const location =
                job.location ||
                "";

            const applyUrl =
                job.apply_link ||
                "";

            const key =
                job.id ||
                `${normalizeText(title)}-${normalizeText(company)}-${normalizeText(location)}-${normalizeText(applyUrl)}`;

            if (!uniqueJobs.has(key)) {
                uniqueJobs.set(
                    key,
                    job
                );
            }
        }

        // ==================================================
        // CALCULATE MATCH
        // ==================================================
        const matchedJobs =
            [...uniqueJobs.values()]
                .map((job) => {

                    const match =
                        calculateMatch(
                            resume.resumeText,
                            job
                        );

                    return {

                        jobId:
                            job.id ||
                            `${job.title || "job"}-${job.company || "company"}`,

                        title:
                            job.job_title ||
                            job.title ||
                            "Job Opportunity",

                        company:
                            job.company ||
                            "Company Not Available",

                        description:
                            job.job_description ||
                            "",

                        aboutCompany:
                            job.about_company ||
                            "",

                        location:
                            job.location ||
                            "Not specified",

                        jobType:
                            job.job_type ||
                            "Not specified",

                        experience:
                            job.experience ||
                            "Not specified",

                        roleAndResponsibility:
                            job.role_and_responsibility ||
                            "",

                        educationAndSkills:
                            job.education_and_skills ||
                            "",

                        applyUrl:
                            job.apply_link ||
                            "",

                        postedDate:
                            job.posted_date ||
                            "",

                        matchPercentage:
                            match.matchPercentage,

                        matchedSkills:
                            match.matchedSkills,

                        missingSkills:
                            match.missingSkills,

                        source:
                            "Indian API"
                    };
                })

                // Only relevant jobs
                .filter(
                    (job) =>
                        job.matchPercentage >= 30
                )

                // Highest match first
                .sort(
                    (a, b) =>
                        b.matchPercentage -
                        a.matchPercentage
                )

                // Maximum 20 jobs
                .slice(0, 20);

        // ==================================================
        // RESPONSE
        // ==================================================
        return res.status(200).json({

            message:
                matchedJobs.length > 0
                    ? "Real and relevant jobs matched successfully"
                    : "No sufficiently relevant live jobs were found",

            resumeId:
                resume._id,

            totalJobs:
                matchedJobs.length,

            jobs:
                matchedJobs
        });

    } catch (error) {

        console.log(
            "Live job matching error:",
            error.response?.data ||
            error.message
        );

        // ==================================================
        // RATE LIMIT
        // ==================================================
        if (
            error.response?.status === 429
        ) {
            return res.status(429).json({
                message:
                    "Indian Jobs API rate limit exceeded. Please try again later."
            });
        }

        // ==================================================
        // OTHER API ERROR
        // ==================================================
        if (error.response) {
            return res.status(
                error.response.status || 500
            ).json({
                message:
                    "Indian Jobs API request failed",
                error:
                    error.response.data
            });
        }

        return res.status(500).json({
            message:
                "Failed to match live jobs",
            error:
                error.message
        });
    }
};