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

const normalizeText = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w+#./-]+/g, " ");
};

const calculateKeywordAnalysis = (resumeText) => {
    const text = normalizeText(resumeText);

    /*
     * Common technical keywords for software developer
     * and MERN/AI fresher resumes.
     *
     * IMPORTANT:
     * We only mark a keyword as FOUND if it actually
     * exists in the uploaded resume.
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
        "node.js",
        "node",
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
        "postman"
    ];

    const foundKeywords = [];
    const missingKeywords = [];

    importantKeywords.forEach((keyword) => {
        const normalizedKeyword = normalizeText(keyword);

        if (
            text.includes(normalizedKeyword)
        ) {
            foundKeywords.push(keyword);
        }
    });

    /*
     * Remove duplicate/conflicting variations.
     * Example: if React.js exists, React should not
     * unnecessarily appear separately.
     */
    const uniqueFoundKeywords = [
        ...new Set(foundKeywords)
    ];

    const uniqueMissingKeywords = importantKeywords.filter(
        (keyword) =>
            !uniqueFoundKeywords.includes(keyword)
    );

    /*
     * Calculate coverage from actual resume content.
     */
    const totalKeywords = importantKeywords.length;

    let keywordCoverage = 0;

    if (totalKeywords > 0) {
        keywordCoverage = Math.round(
            (uniqueFoundKeywords.length /
                totalKeywords) *
                100
        );
    }

    return {
        keywordCoverage,
        keywordsFound: uniqueFoundKeywords,
        missingKeywords: uniqueMissingKeywords
    };
};

export const analyzeResumeWithAI = async (req, res) => {
    try {
        const { resumeId } = req.params;

        if (!resumeId) {
            return res.status(400).json({
                message: "Resume ID is required"
            });
        }

        const resume = await Resume.findOne({
            _id: resumeId,
            user: req.user.userId
        });

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }

        if (
            !resume.resumeText ||
            resume.resumeText.trim() === ""
        ) {
            return res.status(400).json({
                message: "Resume text is empty"
            });
        }

        /*
         * ----------------------------------------
         * KEYWORD ANALYSIS
         * ----------------------------------------
         */

        const keywordAnalysis =
            calculateKeywordAnalysis(
                resume.resumeText
            );

        /*
         * ----------------------------------------
         * GROQ CLIENT
         * ----------------------------------------
         */

        const groq = getGroqClient();

        /*
         * ----------------------------------------
         * SYSTEM PROMPT
         * ----------------------------------------
         */

        const systemPrompt = `
You are an expert professional resume analyzer,
ATS evaluator and career advisor.

Analyze the resume carefully.

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use code fences.
Do NOT add text outside JSON.

You MUST return ALL fields.

Return exactly this structure:

{
  "summary": "short professional summary",

  "atsScore": 75,

  "atsScoreReason": [
    "reason explaining the ATS score",
    "reason explaining the ATS score",
    "reason explaining the ATS score"
  ],

  "atsStrengths": [
    "ATS strength",
    "ATS strength",
    "ATS strength"
  ],

  "atsIssues": [
    "ATS issue",
    "ATS issue",
    "ATS issue"
  ],

  "missingSkills": [
    "missing skill",
    "missing skill",
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

ATS SCORE RULES:

Calculate a realistic ATS score from 0 to 100.

Do NOT automatically give a high score.

Do NOT return 0 unless the resume is empty,
unreadable, or contains almost no useful information.

Evaluate:

- Contact information
- Professional summary
- Education
- Technical skills
- Work experience
- Internship
- Projects
- Certifications
- Relevant keywords
- Action verbs
- Quantifiable achievements
- Resume structure
- ATS-friendly formatting
- Readability
- Career relevance

General scoring:

90-100 = Excellent
80-89 = Very Good
70-79 = Good
60-69 = Average
50-59 = Needs Improvement
0-49 = Needs Major Improvement

atsScoreReason must explain the actual reasons
for the score.

atsStrengths must contain actual ATS-friendly strengths.

atsIssues must contain actual ATS-related problems.

missingSkills must contain useful skills that are
NOT already clearly present in the resume.

Do NOT mark an existing skill as missing.

improvementSuggestions must contain practical steps
that can improve the ATS score.

Do NOT invent:

- experience
- internships
- education
- certifications
- projects
- achievements
- skills

Analyze ONLY the supplied resume.

Keep every field specific to the resume.

ALL fields are mandatory.

Always return valid JSON.
`;

        /*
         * ----------------------------------------
         * USER PROMPT
         * ----------------------------------------
         */

        const userPrompt = `
Analyze this resume carefully.

Calculate the ATS score based ONLY on the actual resume.

Do not invent any experience, skill, project,
certification or achievement.

Make sure every ATS field is returned.

----------------------------------------
RESUME TEXT
----------------------------------------

${resume.resumeText}

----------------------------------------
END RESUME
----------------------------------------
`;

        /*
         * ----------------------------------------
         * GROQ AI REQUEST
         * ----------------------------------------
         */

        const completion =
            await groq.chat.completions.create({

                model: "openai/gpt-oss-120b",

                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userPrompt
                    }
                ],

                temperature: 0.1,

                response_format: {
                    type: "json_object"
                }
            });

        const aiResponse =
            completion.choices?.[0]?.message?.content;

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

        /*
         * ----------------------------------------
         * PARSE AI RESPONSE
         * ----------------------------------------
         */

        let analysis;

        try {
            analysis = JSON.parse(
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

        /*
         * ----------------------------------------
         * ATS SCORE
         * ----------------------------------------
         */

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

        /*
         * ----------------------------------------
         * NORMALIZE AI FIELDS
         * ----------------------------------------
         */

        analysis.summary =
            typeof analysis.summary ===
            "string"
                ? analysis.summary
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

        /*
         * ----------------------------------------
         * FINAL ANALYSIS LOG
         * ----------------------------------------
         */

        console.log(
            "KEYWORD COVERAGE:",
            keywordAnalysis.keywordCoverage
        );

        console.log(
            "KEYWORDS FOUND:",
            keywordAnalysis.keywordsFound
        );

        console.log(
            "MISSING KEYWORDS:",
            keywordAnalysis.missingKeywords
        );

        console.log(
            "FINAL ATS SCORE:",
            analysis.atsScore
        );

        /*
         * ----------------------------------------
         * RESPONSE
         * ----------------------------------------
         */

        return res.status(200).json({

            message:
                "AI resume analysis completed",

            resumeId:
                resume._id,

            analysis: {

                summary:
                    analysis.summary,

                atsScore:
                    analysis.atsScore,

                atsScoreReason:
                    analysis.atsScoreReason,

                atsStrengths:
                    analysis.atsStrengths,

                atsIssues:
                    analysis.atsIssues,

                /*
                 * NEW KEYWORD ANALYSIS
                 */

                keywordCoverage:
                    keywordAnalysis.keywordCoverage,

                keywordsFound:
                    keywordAnalysis.keywordsFound,

                missingKeywords:
                    keywordAnalysis.missingKeywords,

                /*
                 * OTHER ANALYSIS
                 */

                missingSkills:
                    analysis.missingSkills,

                improvementSuggestions:
                    analysis.improvementSuggestions,

                strengths:
                    analysis.strengths,

                weaknesses:
                    analysis.weaknesses,

                suggestions:
                    analysis.suggestions,

                recommendedSkills:
                    analysis.recommendedSkills
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