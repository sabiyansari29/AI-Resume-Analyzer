
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

    if (normalizedSkill === "ai") {
        return /\bai\b/i.test(normalizedText);
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
// FIND SKILLS IN TEXT
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
// GET RESUME ROLES
// ======================================================
const getResumeRoles = (resumeText) => {
    const text = normalizeText(resumeText);

    const roles = [
        {
            keywords: [
                "mern",
                "react",
                "node",
                "express",
                "mongodb"
            ],
            title: "MERN Developer"
        },
        {
            keywords: [
                "react",
                "javascript"
            ],
            title: "React Developer"
        },
        {
            keywords: [
                "node",
                "express",
                "javascript"
            ],
            title: "Node.js Developer"
        },
        {
            keywords: [
                "python",
                "django"
            ],
            title: "Python Developer"
        },
        {
            keywords: [
                "python",
                "flask"
            ],
            title: "Python Developer"
        },
        {
            keywords: [
                "java",
                "spring boot"
            ],
            title: "Java Developer"
        },
        {
            keywords: [
                "machine learning",
                "python"
            ],
            title: "Machine Learning Engineer"
        },
        {
            keywords: [
                "artificial intelligence",
                "python"
            ],
            title: "AI Engineer"
        },
        {
            keywords: [
                "html",
                "css",
                "javascript",
                "react"
            ],
            title: "Frontend Developer"
        },
        {
            keywords: [
                "aws",
                "docker"
            ],
            title: "DevOps Engineer"
        },
        {
            keywords: [
                "sql",
                "python"
            ],
            title: "Data Analyst"
        },
        {
            keywords: [
                "java",
                "data structures",
                "algorithms"
            ],
            title: "Software Developer"
        }
    ];

    const matchedRoles = [];

    for (const role of roles) {
        const count = role.keywords.filter((keyword) =>
            text.includes(normalizeText(keyword))
        ).length;

        if (count >= 1) {
            matchedRoles.push({
                title: role.title,
                score: count
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

    return uniqueRoles.slice(0, 4);
};

// ======================================================
// GET LOCATION FROM RESUME
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
// CALCULATE MATCH PERCENTAGE
// ======================================================
const calculateMatch = (
    resumeText,
    job
) => {
    const jobText = getJobText(job);

    const resumeSkills =
        findSkills(resumeText);

    const jobSkills =
        findSkills(jobText);

    const matchedSkills =
        resumeSkills.filter((skill) =>
            jobSkills.includes(skill)
        );

    const missingSkills =
        jobSkills.filter(
            (skill) =>
                !resumeSkills.includes(skill)
        );

    // --------------------------------------------------
    // SKILL SCORE
    // --------------------------------------------------
    let skillScore = 0;

    if (jobSkills.length > 0) {
        skillScore =
            (
                matchedSkills.length /
                jobSkills.length
            ) * 100;
    }

    // --------------------------------------------------
    // TITLE SCORE
    // --------------------------------------------------
    const resumeNormalized =
        normalizeText(resumeText);

    const title =
        normalizeText(
            `${job.title || ""} ${job.job_title || ""}`
        );

    const titleWords =
        title
            .split(" ")
            .filter(
                (word) =>
                    word.length >= 3
            );

    let titleMatches = 0;

    for (const word of titleWords) {
        if (
            resumeNormalized.includes(word)
        ) {
            titleMatches++;
        }
    }

    let titleScore = 0;

    if (titleWords.length > 0) {
        titleScore =
            (
                titleMatches /
                titleWords.length
            ) * 100;
    }

    // --------------------------------------------------
    // GENERAL KEYWORD SCORE
    // --------------------------------------------------
    const resumeWords = new Set(
        resumeNormalized
            .split(/\s+/)
            .filter(
                (word) =>
                    word.length >= 3
            )
    );

    const jobWords = new Set(
        normalizeText(jobText)
            .split(/\s+/)
            .filter(
                (word) =>
                    word.length >= 3
            )
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
            (
                commonWords /
                jobWords.size
            ) * 100;
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
            Math.min(
                100,
                finalScore
            )
        )
    );

    return {
        matchPercentage: finalScore,
        matchedSkills,
        missingSkills
    };
};

// ======================================================
// FETCH JOBS FROM INDIAN API
// ======================================================
const fetchJobs = async (
    title,
    location = ""
) => {
    const params = {
        title,
        limit: "20"
    };

    if (location) {
        params.location = location;
    }

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
// MATCH LIVE JOBS WITH RESUME
// ======================================================
export const matchJobs = async (
    req,
    res
) => {
    try {
        const { resumeId } =
            req.params;

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
        // RESUME INFORMATION
        // ==================================================
        const resumeText =
            resume.resumeText;

        const resumeRoles =
            getResumeRoles(
                resumeText
            );

        const resumeLocation =
            getResumeLocation(
                resumeText
            );

        console.log(
            "Resume roles:",
            resumeRoles
        );

        console.log(
            "Resume location:",
            resumeLocation || "Not detected"
        );

        // ==================================================
        // FETCH REAL JOBS
        // ==================================================
        let allJobs = [];

        for (
            const role of resumeRoles
        ) {
            try {
                const jobs =
                    await fetchJobs(
                        role,
                        resumeLocation
                    );

                allJobs.push(
                    ...jobs
                );
            } catch (error) {
                console.log(
                    `Job search failed for ${role}:`,
                    error.response?.data ||
                    error.message
                );
            }
        }

        // ==================================================
        // FALLBACK WITHOUT LOCATION
        // ==================================================
        if (
            allJobs.length === 0
        ) {
            for (
                const role of resumeRoles
            ) {
                try {
                    const jobs =
                        await fetchJobs(
                            role
                        );

                    allJobs.push(
                        ...jobs
                    );
                } catch (error) {
                    console.log(
                        `Fallback search failed for ${role}:`,
                        error.response?.data ||
                        error.message
                    );
                }
            }
        }

        // ==================================================
        // NO LIVE JOBS
        // ==================================================
        if (
            allJobs.length === 0
        ) {
            return res.status(200).json({
                message:
                    "No live jobs were found for your resume",
                resumeId:
                    resume._id,
                totalJobs: 0,
                jobs: []
            });
        }

        // ==================================================
        // REMOVE DUPLICATES
        // ==================================================
        const uniqueJobs =
            new Map();

        for (
            const job of allJobs
        ) {
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
                `${normalizeText(title)}-${normalizeText(company)}-${normalizeText(location)}-${applyUrl}`;

            if (
                !uniqueJobs.has(key)
            ) {
                uniqueJobs.set(
                    key,
                    job
                );
            }
        }

        // ==================================================
        // CALCULATE MATCHING
        // ==================================================
        const matchedJobs =
            [...uniqueJobs.values()]
                .map((job) => {

                    const match =
                        calculateMatch(
                            resumeText,
                            job
                        );

                    return {
                        jobId:
                            job.id ||
                            `${job.title}-${job.company}`,

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

                // ==================================================
                // ONLY RELEVANT JOBS
                // ==================================================
                .filter(
                    (job) =>
                        job.matchPercentage >= 30
                )

                // ==================================================
                // BEST MATCH FIRST
                // ==================================================
                .sort(
                    (a, b) =>
                        b.matchPercentage -
                        a.matchPercentage
                )

                // ==================================================
                // TOP 20
                // ==================================================
                .slice(0, 20);

        // ==================================================
        // RESPONSE
        // ==================================================
        return res.status(200).json({
            message:
                "Real and relevant jobs matched successfully",

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

        if (
            error.response
        ) {
            return res.status(
                error.response.status ||
                500
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
