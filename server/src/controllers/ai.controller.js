import Resume from "../models/resume.model.js";
import Groq from "groq-sdk";

const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing");
    }

    return new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
};

// =====================================================
// ARRAY HELPER
// =====================================================

const ensureArray = (value) => {
    if (Array.isArray(value)) {
        return value.filter(
            (item) =>
                typeof item === "string" &&
                item.trim() !== ""
        );
    }

    return [];
};

// =====================================================
// TEXT NORMALIZATION
// =====================================================

const normalizeText = (text) => {
    return String(text || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
};

// =====================================================
// KEYWORD MATCHING
// =====================================================

const containsKeyword = (text, keyword) => {
    const normalizedText = normalizeText(text);
    const normalizedKeyword = normalizeText(keyword);

    if (!normalizedText || !normalizedKeyword) {
        return false;
    }

    // Special handling for keywords containing symbols
    if (
        normalizedKeyword === "c++" ||
        normalizedKeyword === "c#"
    ) {
        return normalizedText.includes(normalizedKeyword);
    }

    // Normal keyword search
    return normalizedText.includes(normalizedKeyword);
};

// =====================================================
// KEYWORD ANALYSIS
// =====================================================

const calculateKeywordAnalysis = (resumeText) => {

    /*
     * These are common keywords for:
     *
     * MERN
     * Full Stack Development
     * Frontend Development
     * Backend Development
     * AI / Software Development
     *
     * IMPORTANT:
     * A keyword is marked FOUND only when it
     * actually exists in the uploaded resume.
     */

    const importantKeywords = [
        "javascript",
        "java",
        "python",
        "c++",
        "html",
        "css",

        "react",
        "react.js",
        "tailwind",
        "tailwind css",

        "node",
        "node.js",

        "express",
        "express.js",

        "mongodb",
        "mysql",
        "sql",

        "rest api",
        "rest apis",
        "api",

        "jwt",

        "git",
        "github",

        "typescript",

        "docker",

        "aws",
        "azure",
        "gcp",

        "ci/cd",
        "github actions",
        "jenkins",

        "jest",
        "mocha",
        "testing",

        "agile",
        "scrum",

        "machine learning",
        "artificial intelligence",
        "ai",
        "generative ai",

        "groq",

        "mern",
        "full stack",
        "full-stack",

        "frontend",
        "backend",

        "responsive design",

        "firebase",

        "flask",
        "django",
        "fastapi",

        "bootstrap",
        "redux",
        "vite",

        "vercel",
        "netlify",
        "render",

        "postman",

        "rest",
        "api development",

        "authentication",
        "authorization",

        "responsive web design",

        "problem solving",
        "data structures",
        "algorithms",

        "communication",
        "teamwork"
    ];

    const foundKeywords = [];
    const missingKeywords = [];

    importantKeywords.forEach((keyword) => {

        if (
            containsKeyword(
                resumeText,
                keyword
            )
        ) {
            foundKeywords.push(keyword);
        } else {
            missingKeywords.push(keyword);
        }
    });

    /*
     * Remove duplicate keywords.
     */

    const uniqueFoundKeywords = [
        ...new Set(foundKeywords)
    ];

    const uniqueMissingKeywords = [
        ...new Set(missingKeywords)
    ];

    /*
     * IMPORTANT:
     *
     * Coverage is calculated from the actual
     * keyword list.
     */

    const totalKeywords =
        uniqueFoundKeywords.length +
        uniqueMissingKeywords.length;

    const keywordCoverage =
        totalKeywords > 0
            ? Math.round(
                  (uniqueFoundKeywords.length /
                      totalKeywords) *
                      100
              )
            : 0;

    return {
        keywordCoverage,
        keywordsFound: uniqueFoundKeywords,
        missingKeywords: uniqueMissingKeywords
    };
};

// =====================================================
// AI RESUME ANALYSIS
// =====================================================

export const analyzeResumeWithAI = async (
    req,
    res
) => {

    try {

        const { resumeId } = req.params;

        // =====================================================
        // VALIDATE RESUME ID
        // =====================================================

        if (!resumeId) {

            return res.status(400).json({
                message:
                    "Resume ID is required"
            });

        }

        // =====================================================
        // FIND RESUME
        // =====================================================

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

        // =====================================================
        // CHECK RESUME TEXT
        // =====================================================

        if (
            !resume.resumeText ||
            resume.resumeText.trim() === ""
        ) {

            return res.status(400).json({
                message:
                    "Resume text is empty"
            });

        }

        // =====================================================
        // KEYWORD ANALYSIS
        // =====================================================

        const keywordAnalysis =
            calculateKeywordAnalysis(
                resume.resumeText
            );

        console.log(
            "======================================"
        );

        console.log(
            "KEYWORD ANALYSIS"
        );

        console.log(
            "Keyword Coverage:",
            keywordAnalysis.keywordCoverage + "%"
        );

        console.log(
            "Keywords Found:",
            keywordAnalysis.keywordsFound
        );

        console.log(
            "Missing Keywords:",
            keywordAnalysis.missingKeywords
        );

        console.log(
            "======================================"
        );

        // =====================================================
        // GROQ CLIENT
        // =====================================================

        const groq =
            getGroqClient();

        // =====================================================
        // SYSTEM PROMPT
        // =====================================================

        const systemPrompt = `

You are an expert ATS resume evaluator,
professional resume analyzer and career advisor.

Analyze ONLY the resume text supplied by the user.

Never invent:

- skills
- experience
- internships
- projects
- certifications
- achievements
- education
- technologies

Return ONLY valid JSON.

Do NOT use markdown.

Do NOT use code fences.

Do NOT add explanations outside JSON.

Return exactly this structure:

{
  "summary": "short professional summary",

  "atsScore": 75,

  "atsScoreReason": [
    "specific reason",
    "specific reason",
    "specific reason",
    "specific reason"
  ],

  "atsStrengths": [
    "specific ATS strength",
    "specific ATS strength",
    "specific ATS strength"
  ],

  "atsIssues": [
    "specific ATS issue",
    "specific ATS issue",
    "specific ATS issue"
  ],

  "missingSkills": [
    "missing skill"
  ],

  "improvementSuggestions": [
    "specific improvement",
    "specific improvement",
    "specific improvement",
    "specific improvement"
  ],

  "strengths": [
    "resume strength",
    "resume strength",
    "resume strength"
  ],

  "weaknesses": [
    "resume weakness",
    "resume weakness",
    "resume weakness"
  ],

  "suggestions": [
    "career suggestion",
    "career suggestion",
    "career suggestion"
  ],

  "recommendedSkills": [
    "recommended skill",
    "recommended skill",
    "recommended skill",
    "recommended skill",
    "recommended skill"
  ]
}

========================================
ATS SCORE
========================================

Calculate atsScore from 0 to 100.

Evaluate:

1. Contact Information
2. Professional Summary
3. Education
4. Technical Skills
5. Work Experience
6. Internship Experience
7. Projects
8. Certifications
9. Relevant Technical Keywords
10. Action Verbs
11. Quantifiable Achievements
12. Resume Structure
13. ATS-friendly formatting
14. Readability
15. Career Relevance
16. Consistency
17. Practical Experience

General scale:

90-100 = Excellent
80-89 = Very Good
70-79 = Good
60-69 = Average
50-59 = Needs Improvement
0-49 = Needs Major Improvement

Do NOT automatically give a high score.

A fresher with strong projects can receive a good score,
but projects should not be treated exactly like professional work experience.

Do not claim a skill is present unless it is actually written.

For example:

React does NOT mean TypeScript.

JavaScript does NOT mean TypeScript.

MongoDB does NOT mean AWS.

Git does NOT mean GitHub Actions.

========================================
ATS SCORE REASONS
========================================

Explain why the score was given.

Use specific observations from the resume.

Do not use generic statements.

========================================
ATS STRENGTHS
========================================

Mention only genuine strengths present in the resume.

========================================
ATS ISSUES
========================================

Mention actual problems in the resume.

Do not say something is missing if it actually exists.

========================================
MISSING SKILLS
========================================

Recommend relevant skills that are NOT clearly present.

For a MERN/full-stack candidate, examples can include:

TypeScript
Docker
AWS
CI/CD
Jest
Testing
Redis
System Design

Only recommend relevant skills.

========================================
IMPROVEMENT SUGGESTIONS
========================================

Give practical suggestions.

Focus on:

- measurable achievements
- stronger project descriptions
- relevant keywords
- internship/work experience when genuine
- ATS formatting
- technical skills
- certifications
- action verbs
- role-specific customization

Do not invent experience.

========================================
FINAL RULES
========================================

Every field is mandatory.

All arrays must contain strings.

atsScore must be a number from 0 to 100.

Always return valid JSON.

`;

        // =====================================================
        // USER PROMPT
        // =====================================================

        const userPrompt = `

Analyze the following resume carefully.

Use ONLY information contained in the resume.

Do not invent:

- skills
- experience
- internship
- projects
- certifications
- achievements
- education

Evaluate the resume for ATS compatibility and software
development career opportunities.

----------------------------------------
RESUME TEXT
----------------------------------------

${resume.resumeText}

----------------------------------------
END RESUME
----------------------------------------

`;

        // =====================================================
        // GROQ REQUEST
        // =====================================================

        const completion =
            await groq.chat.completions.create({

                model:
                    "openai/gpt-oss-120b",

                messages: [
                    {
                        role: "system",
                        content:
                            systemPrompt
                    },
                    {
                        role: "user",
                        content:
                            userPrompt
                    }
                ],

                temperature: 0.1,

                response_format: {
                    type: "json_object"
                }
            });

        // =====================================================
        // AI RESPONSE
        // =====================================================

        const aiResponse =
            completion
                .choices?.[0]
                ?.message?.content;

        if (!aiResponse) {

            return res.status(500).json({
                message:
                    "AI did not return any analysis"
            });

        }

        console.log(
            "RAW AI RESPONSE:"
        );

        console.log(
            aiResponse
        );

        // =====================================================
        // PARSE JSON
        // =====================================================

        let analysis;

        try {

            analysis =
                JSON.parse(
                    aiResponse.trim()
                );

        } catch (error) {

            console.log(
                "AI JSON Parse Error:",
                error.message
            );

            console.log(
                "Invalid AI Response:",
                aiResponse
            );

            return res.status(500).json({
                message:
                    "AI returned invalid JSON"
            });

        }

        // =====================================================
        // ATS SCORE VALIDATION
        // =====================================================

        let atsScore =
            Number(
                analysis.atsScore
            );

        if (
            !Number.isFinite(
                atsScore
            )
        ) {

            atsScore = 0;

        }

        atsScore =
            Math.round(
                atsScore
            );

        atsScore =
            Math.max(
                0,
                Math.min(
                    100,
                    atsScore
                )
            );

        analysis.atsScore =
            atsScore;

        // =====================================================
        // NORMALIZE AI RESPONSE
        // =====================================================

        analysis.summary =
            typeof analysis.summary ===
            "string"
                ? analysis.summary.trim()
                : "Resume analysis completed.";

        analysis.atsScoreReason =
            ensureArray(
                analysis.atsScoreReason
            );

        analysis.atsStrengths =
            ensureArray(
                analysis.atsStrengths
            );

        analysis.atsIssues =
            ensureArray(
                analysis.atsIssues
            );

        analysis.missingSkills =
            ensureArray(
                analysis.missingSkills
            );

        analysis.improvementSuggestions =
            ensureArray(
                analysis.improvementSuggestions
            );

        analysis.strengths =
            ensureArray(
                analysis.strengths
            );

        analysis.weaknesses =
            ensureArray(
                analysis.weaknesses
            );

        analysis.suggestions =
            ensureArray(
                analysis.suggestions
            );

        analysis.recommendedSkills =
            ensureArray(
                analysis.recommendedSkills
            );

        // =====================================================
        // FINAL LOG
        // =====================================================

        console.log(
            "======================================"
        );

        console.log(
            "FINAL ATS SCORE:",
            analysis.atsScore
        );

        console.log(
            "FINAL KEYWORD COVERAGE:",
            keywordAnalysis.keywordCoverage + "%"
        );

        console.log(
            "FOUND KEYWORDS COUNT:",
            keywordAnalysis.keywordsFound.length
        );

        console.log(
            "MISSING KEYWORDS COUNT:",
            keywordAnalysis.missingKeywords.length
        );

        console.log(
            "======================================"
        );

        // =====================================================
        // FINAL RESPONSE
        // =====================================================

        return res.status(200).json({

            message:
                "AI resume analysis completed",

            resumeId:
                resume._id,

            analysis: {

                // -----------------------------
                // SUMMARY
                // -----------------------------

                summary:
                    analysis.summary,

                // -----------------------------
                // ATS
                // -----------------------------

                atsScore:
                    analysis.atsScore,

                atsScoreReason:
                    analysis.atsScoreReason,

                atsStrengths:
                    analysis.atsStrengths,

                atsIssues:
                    analysis.atsIssues,

                // -----------------------------
                // KEYWORD ANALYSIS
                // -----------------------------

                keywordCoverage:
                    keywordAnalysis.keywordCoverage,

                keywordsFound:
                    keywordAnalysis.keywordsFound,

                missingKeywords:
                    keywordAnalysis.missingKeywords,

                // -----------------------------
                // SKILLS
                // -----------------------------

                missingSkills:
                    analysis.missingSkills,

                recommendedSkills:
                    analysis.recommendedSkills,

                // -----------------------------
                // IMPROVEMENTS
                // -----------------------------

                improvementSuggestions:
                    analysis.improvementSuggestions,

                // -----------------------------
                // GENERAL ANALYSIS
                // -----------------------------

                strengths:
                    analysis.strengths,

                weaknesses:
                    analysis.weaknesses,

                suggestions:
                    analysis.suggestions
            }
        });

    } catch (error) {

        console.log(
            "AI ANALYSIS ERROR:",
            error
        );

        if (error?.status) {

            console.log(
                "Groq status:",
                error.status
            );

            console.log(
                "Groq error:",
                error.error ||
                    error.message
            );

        }

        return res.status(500).json({

            message:
                "Failed to analyze resume",

            error:
                error.message
        });

    }
};