import Resume from "../models/resume.model.js";
import Groq from "groq-sdk";

// ========================================
// GROQ CLIENT
// ========================================

const getGroqClient = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing");
    }

    return new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
};


// ========================================
// ANALYZE RESUME WITH AI
// ========================================

export const analyzeResumeWithAI = async (req, res) => {
    try {

        // --------------------------------
        // 1. Get Resume ID
        // --------------------------------

        const { resumeId } = req.params;

        if (!resumeId) {
            return res.status(400).json({
                message: "Resume ID is required"
            });
        }


        // --------------------------------
        // 2. Find Resume
        // --------------------------------

        const resume = await Resume.findOne({
            _id: resumeId,
            user: req.user.userId
        });

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }


        // --------------------------------
        // 3. Check Resume Text
        // --------------------------------

        if (
            !resume.resumeText ||
            resume.resumeText.trim() === ""
        ) {
            return res.status(400).json({
                message: "Resume text is empty"
            });
        }


        // --------------------------------
        // 4. Create Groq Client
        // --------------------------------

        const groq = getGroqClient();


        // --------------------------------
        // 5. AI Prompt
        // --------------------------------

        const systemPrompt = `
You are an expert professional resume analyzer.

Analyze the given resume carefully.

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use code fences.
Do NOT add any explanation outside JSON.

Return exactly this structure:

{
  "summary": "short professional summary",
  "strengths": [
    "strength 1",
    "strength 2",
    "strength 3"
  ],
  "weaknesses": [
    "weakness 1",
    "weakness 2",
    "weakness 3"
  ],
  "suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3"
  ],
  "recommendedSkills": [
    "skill 1",
    "skill 2",
    "skill 3"
  ]
}

Rules:

1. summary must be a short professional summary.
2. strengths must contain useful strengths found in the resume.
3. weaknesses must contain realistic areas for improvement.
4. suggestions must contain practical resume/career suggestions.
5. recommendedSkills must contain skills useful for improving the candidate profile.
6. Do not invent information that is clearly unrelated to the resume.
7. Always return valid JSON.
`;


        const userPrompt = `
Analyze the following resume:

--------------------------------
RESUME
--------------------------------

${resume.resumeText}

--------------------------------
END RESUME
--------------------------------
`;


        // --------------------------------
        // 6. Call Groq
        // --------------------------------

        const completion =
            await groq.chat.completions.create({

                // Current Groq production model
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

                temperature: 0.2,

                // Force JSON response
                response_format: {
                    type: "json_object"
                }

            });


        // --------------------------------
        // 7. Get AI Response
        // --------------------------------

        const aiResponse =
            completion.choices?.[0]?.message?.content;


        if (!aiResponse) {
            return res.status(500).json({
                message: "AI did not return any analysis"
            });
        }


        console.log(
            "AI Response:",
            aiResponse
        );


        // --------------------------------
        // 8. Parse JSON
        // --------------------------------

        let analysis;

        try {

            analysis = JSON.parse(
                aiResponse.trim()
            );

        } catch (parseError) {

            console.log(
                "AI JSON Parse Error:",
                parseError.message
            );

            console.log(
                "Invalid AI Response:",
                aiResponse
            );

            return res.status(500).json({
                message: "AI returned invalid JSON"
            });
        }


        // --------------------------------
        // 9. Make Sure Required Fields Exist
        // --------------------------------

        analysis.summary =
            analysis.summary || "";

        analysis.strengths =
            Array.isArray(analysis.strengths)
                ? analysis.strengths
                : [];

        analysis.weaknesses =
            Array.isArray(analysis.weaknesses)
                ? analysis.weaknesses
                : [];

        analysis.suggestions =
            Array.isArray(analysis.suggestions)
                ? analysis.suggestions
                : [];

        analysis.recommendedSkills =
            Array.isArray(analysis.recommendedSkills)
                ? analysis.recommendedSkills
                : [];


        // --------------------------------
        // 10. Send Response
        // --------------------------------

        return res.status(200).json({

            message:
                "AI resume analysis completed",

            resumeId:
                resume._id,

            analysis

        });

    } catch (error) {

        console.log(
            "AI analysis error:",
            error.message
        );

        // Groq specific error
        if (error?.status) {

            console.log(
                "Groq status:",
                error.status
            );

            console.log(
                "Groq error:",
                error.error || error.message
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