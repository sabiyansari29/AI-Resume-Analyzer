import axios from "axios";
import Job from "../models/job.model.js";
import Resume from "../models/resume.model.js";

// ======================================================
// CREATE JOB
// ======================================================
export const createJob = async (req, res) => {
    try {
        const {
            title,
            company,
            description,
            requiredSkills,
            location,
            jobType,
            applyUrl
        } = req.body;

        if (!title || !company || !description) {
            return res.status(400).json({
                message: "Title, company and description are required"
            });
        }

        const job = await Job.create({
            title,
            company,
            description,
            requiredSkills: requiredSkills || [],
            location: location || "Remote",
            jobType: jobType || "Full-time",
            applyUrl: applyUrl || ""
        });

        const populatedJob = await Job.findById(job._id)
            .populate("requiredSkills");

        return res.status(201).json({
            message: "Job created successfully",
            job: populatedJob
        });

    } catch (error) {
        console.log("Create job error:", error.message);

        return res.status(500).json({
            message: "Failed to create job",
            error: error.message
        });
    }
};


// ======================================================
// GET ALL JOBS FROM DATABASE
// ======================================================
export const getJobs = async (req, res) => {
    try {
        const {
            search,
            location,
            jobType
        } = req.query;

        const filter = {};

        if (search && search.trim() !== "") {
            filter.$or = [
                {
                    title: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },
                {
                    company: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                }
            ];
        }

        if (
            location &&
            location.trim() !== "" &&
            location !== "All"
        ) {
            filter.location = {
                $regex: location.trim(),
                $options: "i"
            };
        }

        if (
            jobType &&
            jobType.trim() !== "" &&
            jobType !== "All"
        ) {
            filter.jobType = jobType;
        }

        const jobs = await Job.find(filter)
            .populate("requiredSkills")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Jobs fetched successfully",
            totalJobs: jobs.length,
            jobs
        });

    } catch (error) {
        console.log("Get jobs error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch jobs",
            error: error.message
        });
    }
};


// ======================================================
// GET SINGLE JOB
// ======================================================
export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id)
            .populate("requiredSkills");

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        return res.status(200).json({
            message: "Job fetched successfully",
            job
        });

    } catch (error) {
        console.log("Get job error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch job",
            error: error.message
        });
    }
};


// ======================================================
// UPDATE JOB
// ======================================================
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            company,
            description,
            requiredSkills,
            location,
            jobType,
            applyUrl
        } = req.body;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        if (title !== undefined) {
            job.title = title;
        }

        if (company !== undefined) {
            job.company = company;
        }

        if (description !== undefined) {
            job.description = description;
        }

        if (requiredSkills !== undefined) {
            job.requiredSkills = requiredSkills;
        }

        if (location !== undefined) {
            job.location = location;
        }

        if (jobType !== undefined) {
            job.jobType = jobType;
        }

        if (applyUrl !== undefined) {
            job.applyUrl = applyUrl;
        }

        await job.save();

        const updatedJob = await Job.findById(job._id)
            .populate("requiredSkills");

        return res.status(200).json({
            message: "Job updated successfully",
            job: updatedJob
        });

    } catch (error) {
        console.log("Update job error:", error.message);

        return res.status(500).json({
            message: "Failed to update job",
            error: error.message
        });
    }
};


// ======================================================
// DELETE JOB
// ======================================================
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findByIdAndDelete(id);

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        return res.status(200).json({
            message: "Job deleted successfully"
        });

    } catch (error) {
        console.log("Delete job error:", error.message);

        return res.status(500).json({
            message: "Failed to delete job",
            error: error.message
        });
    }
};


// ======================================================
// FETCH LIVE JOBS
// ======================================================
export const fetchLiveJobs = async (req, res) => {
    try {
        const {
            title,
            location,
            limit
        } = req.query;

        if (!process.env.INDIAN_API_KEY) {
            return res.status(500).json({
                message: "INDIAN_API_KEY is not configured on server"
            });
        }

        const params = {
            limit: Number(limit) || 20
        };

        if (title && title.trim() !== "") {
            params.title = title.trim();
        }

        if (location && location.trim() !== "") {
            params.location = location.trim();
        }

        const response = await axios.get(
            "https://jobs.indianapi.in/jobs",
            {
                params,
                headers: {
                    "x-api-key": process.env.INDIAN_API_KEY
                },
                timeout: 15000
            }
        );

        const jobs = Array.isArray(response.data)
            ? response.data
            : response.data?.jobs || [];

        return res.status(200).json({
            message: "Live jobs fetched successfully",
            totalJobs: jobs.length,
            jobs
        });

    } catch (error) {
        console.log(
            "Indian API error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            message: "Failed to fetch live jobs",
            error:
                error.response?.data ||
                error.message
        });
    }
};


// ======================================================
// TEXT HELPERS
// ======================================================
const normalizeText = (text = "") => {
    return String(text)
        .toLowerCase()
        .replace(/[^\w+#.\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};


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
    "rest api",
    "rest apis",
    "jwt",
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
    "machine learning",
    "artificial intelligence",
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
    "scrum"
];


// ======================================================
// FIND SKILLS IN TEXT
// ======================================================
const findSkillsInText = (text = "") => {
    const normalized = normalizeText(text);

    return technicalSkills.filter((skill) => {
        const skillText = normalizeText(skill);

        if (
            skillText.includes(" ") ||
            skillText.includes(".") ||
            skillText.includes("+") ||
            skillText.includes("#")
        ) {
            return normalized.includes(skillText);
        }

        const regex = new RegExp(
            `\\b${skillText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "i"
        );

        return regex.test(normalized);
    });
};


// ======================================================
// GET ALL JOB TEXT
// ======================================================
const getJobText = (job) => {
    return [
        job.title,
        job.job_title,
        job.company,
        job.job_description,
        job.description,
        job.about_company,
        job.role_and_responsibility,
        job.education_and_skills,
        job.experience,
        job.location,
        job.job_type,
        job.jobType
    ]
        .filter(Boolean)
        .join(" ");
};


// ======================================================
// CALCULATE JOB RELEVANCE
// ======================================================
const calculateJobRelevance = (resumeText, job) => {
    const resumeNormalized = normalizeText(resumeText);

    const jobText = getJobText(job);
    const jobNormalized = normalizeText(jobText);

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

    // ----------------------------------------------
    // RESUME SKILLS
    // ----------------------------------------------
    const resumeSkills =
        findSkillsInText(resumeNormalized);

    // ----------------------------------------------
    // JOB SKILLS
    // ----------------------------------------------
    const jobSkills =
        findSkillsInText(jobNormalized);

    // Remove duplicate skills
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

    // ----------------------------------------------
    // MATCHED SKILLS
    // ----------------------------------------------
    const matchedSkills =
        uniqueResumeSkills.filter(
            (resumeSkill) =>
                uniqueJobSkills.includes(resumeSkill)
        );

    // ----------------------------------------------
    // MISSING SKILLS
    // ----------------------------------------------
    const missingSkills =
        uniqueJobSkills.filter(
            (jobSkill) =>
                !uniqueResumeSkills.includes(jobSkill)
        );

    // ----------------------------------------------
    // SKILL SCORE
    // ----------------------------------------------
    const skillScore =
        uniqueJobSkills.length > 0
            ? (
                matchedSkills.length /
                uniqueJobSkills.length
            ) * 100
            : 0;

    // ----------------------------------------------
    // GENERAL KEYWORD SCORE
    // ----------------------------------------------
    let commonWords = 0;

    for (const word of jobWords) {
        if (resumeWords.has(word)) {
            commonWords++;
        }
    }

    const keywordScore =
        jobWords.size > 0
            ? (commonWords / jobWords.size) * 100
            : 0;

    // ----------------------------------------------
    // TITLE SCORE
    // ----------------------------------------------
    const titleText =
        `${job.title || ""} ${job.job_title || ""}`;

    const titleWords = getWords(titleText);

    let titleMatches = 0;

    for (const word of titleWords) {
        if (resumeWords.has(word)) {
            titleMatches++;
        }
    }

    const titleScore =
        titleWords.size > 0
            ? (titleMatches / titleWords.size) * 100
            : 0;

    // ----------------------------------------------
    // ROLE BASED SCORE
    // ----------------------------------------------
    const resumeRoleTerms =
        getRoleSearchTerms(resumeText);

    const jobTitleNormalized =
        normalizeText(titleText);

    let roleScore = 0;

    for (const role of resumeRoleTerms) {
        const roleWords = getWords(role.title);

        let matchedRoleWords = 0;

        for (const word of roleWords) {
            if (jobTitleNormalized.includes(word)) {
                matchedRoleWords++;
            }
        }

        if (roleWords.size > 0) {
            const currentScore =
                (matchedRoleWords /
                    roleWords.size) * 100;

            roleScore = Math.max(
                roleScore,
                currentScore
            );
        }
    }

    // ----------------------------------------------
    // FINAL SCORE
    // ----------------------------------------------
    let finalScore =
        skillScore * 0.60 +
        titleScore * 0.20 +
        keywordScore * 0.10 +
        roleScore * 0.10;

    // If job has no detectable technical skills
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
// GET ROLE SEARCH TERMS FROM RESUME
// ======================================================
const getRoleSearchTerms = (resumeText = "") => {
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
                "java"
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
                "data structures",
                "algorithms",
                "javascript"
            ],
            title: "Software Developer"
        },

        {
            keywords: [
                "html",
                "css",
                "javascript"
            ],
            title: "Frontend Developer"
        },

        {
            keywords: [
                "aws",
                "docker",
                "kubernetes"
            ],
            title: "DevOps Engineer"
        },

        {
            keywords: [
                "sql",
                "python",
                "data"
            ],
            title: "Data Analyst"
        }
    ];

    const matchedRoles = [];

    for (const role of roles) {
        const matchCount =
            role.keywords.filter(
                (keyword) =>
                    text.includes(
                        normalizeText(keyword)
                    )
            ).length;

        if (matchCount >= 1) {
            matchedRoles.push({
                title: role.title,
                score: matchCount
            });
        }
    }

    matchedRoles.sort(
        (a, b) => b.score - a.score
    );

    const uniqueTitles = [];

    for (const role of matchedRoles) {
        if (
            !uniqueTitles.includes(
                role.title
            )
        ) {
            uniqueTitles.push(
                role.title
            );
        }
    }

    if (uniqueTitles.length === 0) {
        uniqueTitles.push(
            "Software Developer"
        );
    }

    return uniqueTitles.slice(0, 3);
};


// ======================================================
// EXTRACT LOCATION FROM RESUME
// ======================================================
const getResumeLocation = (resumeText = "") => {
    const text = normalizeText(resumeText);

    const locations = [
        "lucknow",
        "delhi",
        "new delhi",
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
        "bhopal",
        "remote"
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
// FETCH LIVE JOBS FOR RESUME
// ======================================================
const fetchJobsForResume = async (
    resumeText
) => {

    const searchTerms =
        getRoleSearchTerms(resumeText);

    const resumeLocation =
        getResumeLocation(resumeText);

    const allJobs = [];

    // ----------------------------------------------
    // SEARCH EACH RELEVANT ROLE
    // ----------------------------------------------
    for (const searchTerm of searchTerms) {

        try {

            const params = {
                title: searchTerm,
                limit: 20
            };

            // Location is NOT forced.
            // This allows remote + other relevant jobs.
            if (resumeLocation) {
                params.location =
                    resumeLocation;
            }

            const response =
                await axios.get(
                    "https://jobs.indianapi.in/jobs",
                    {
                        params,
                        headers: {
                            "x-api-key":
                                process.env
                                    .INDIAN_API_KEY
                        },
                        timeout: 15000
                    }
                );

            const receivedJobs =
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : response.data?.jobs || [];

            allJobs.push(
                ...receivedJobs
            );

        } catch (error) {

            console.log(
                `Live job search failed for ${searchTerm}:`,
                error.response?.data ||
                    error.message
            );
        }
    }

    // ----------------------------------------------
    // IF LOCATION SEARCH RETURNS NOTHING,
    // SEARCH AGAIN WITHOUT LOCATION
    // ----------------------------------------------
    if (allJobs.length === 0) {

        for (const searchTerm of searchTerms) {

            try {

                const response =
                    await axios.get(
                        "https://jobs.indianapi.in/jobs",
                        {
                            params: {
                                title:
                                    searchTerm,
                                limit: 20
                            },
                            headers: {
                                "x-api-key":
                                    process.env
                                        .INDIAN_API_KEY
                            },
                            timeout: 15000
                        }
                    );

                const receivedJobs =
                    Array.isArray(
                        response.data
                    )
                        ? response.data
                        : response.data?.jobs || [];

                allJobs.push(
                    ...receivedJobs
                );

            } catch (error) {

                console.log(
                    `Fallback search failed for ${searchTerm}:`,
                    error.response?.data ||
                        error.message
                );
            }
        }
    }

    return allJobs;
};


// ======================================================
// MATCH RESUME WITH REAL LIVE JOBS
// ======================================================
export const matchJobs = async (
    req,
    res
) => {

    try {

        const { resumeId } =
            req.params;

        // ----------------------------------------------
        // FIND USER RESUME
        // ----------------------------------------------
        const resume =
            await Resume.findOne({
                _id: resumeId,
                user: req.user._id
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
                    "Resume text is not available for job matching"
            });
        }

        // ----------------------------------------------
        // CHECK API KEY
        // ----------------------------------------------
        if (
            !process.env
                .INDIAN_API_KEY
        ) {
            return res.status(500).json({
                message:
                    "INDIAN_API_KEY is not configured on server"
            });
        }

        // ----------------------------------------------
        // FETCH REAL JOBS
        // ----------------------------------------------
        const liveJobs =
            await fetchJobsForResume(
                resume.resumeText
            );

        if (!liveJobs.length) {
            return res.status(200).json({
                message:
                    "No live jobs were found for your resume",
                resumeId,
                totalJobs: 0,
                jobs: []
            });
        }

        // ----------------------------------------------
        // REMOVE DUPLICATE JOBS
        // ----------------------------------------------
        const uniqueJobsMap =
            new Map();

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
                job.applyUrl ||
                job.application_url ||
                job.url ||
                "";

            const key =
                job.id ||
                `${normalizeText(title)}-${normalizeText(company)}-${normalizeText(location)}-${applyUrl}`;

            if (
                !uniqueJobsMap.has(key)
            ) {
                uniqueJobsMap.set(
                    key,
                    job
                );
            }
        }

        const uniqueJobs =
            [...uniqueJobsMap.values()];

        // ----------------------------------------------
        // CALCULATE RELEVANCE
        // ----------------------------------------------
        const matchedJobs =
            uniqueJobs
                .map((job) => {

                    const relevance =
                        calculateJobRelevance(
                            resume.resumeText,
                            job
                        );

                    return {

                        jobId:
                            job.id ||
                            job._id ||
                            `${job.title}-${job.company}`,

                        title:
                            job.title ||
                            job.job_title ||
                            "Job Opportunity",

                        company:
                            job.company ||
                            "Company Not Specified",

                        description:
                            job.job_description ||
                            job.description ||
                            "",

                        location:
                            job.location ||
                            "Not specified",

                        jobType:
                            job.job_type ||
                            job.jobType ||
                            "Not specified",

                        experience:
                            job.experience ||
                            "",

                        postedDate:
                            job.posted_date ||
                            job.postedDate ||
                            job.created_at ||
                            "",

                        applyUrl:
                            job.apply_link ||
                            job.applyUrl ||
                            job.application_url ||
                            job.url ||
                            "",

                        matchedSkills:
                            relevance.matchedSkills,

                        missingSkills:
                            relevance.missingSkills,

                        matchPercentage:
                            relevance.percentage,

                        source:
                            "Indian API"
                    };
                })

                // ------------------------------------------
                // ONLY RELEVANT JOBS
                // ------------------------------------------
                .filter(
                    (job) =>
                        job.matchPercentage >= 30
                )

                // ------------------------------------------
                // BEST MATCH FIRST
                // ------------------------------------------
                .sort(
                    (a, b) =>
                        b.matchPercentage -
                        a.matchPercentage
                )

                // ------------------------------------------
                // TOP 20
                // ------------------------------------------
                .slice(0, 20);

        return res.status(200).json({

            message:
                "Real and relevant jobs matched successfully",

            resumeId,

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

        return res.status(500).json({

            message:
                "Failed to find relevant live jobs",

            error:
                error.response?.data ||
                error.message
        });
    }
};