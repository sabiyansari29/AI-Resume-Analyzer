import Resume from "../models/resume.model.js";

export const analyzeResume = async (req, res) => {
    try {
        const { resumeId } = req.params;

        // 1. Find resume of logged-in user
        const resume = await Resume.findOne({
            _id: resumeId,
            user: req.user.userId
        });

        if (!resume) {
            return res.status(404).json({
                message: "Resume not found"
            });
        }

        // 2. Get resume text
        const text = resume.resumeText || "";
        const lowerText = text.toLowerCase();

        // 3. Calculate section scores

        // Skills
        const skillKeywords = [
            "skills",
            "technical skills",
            "technologies"
        ];

        const hasSkills = skillKeywords.some((keyword) =>
            lowerText.includes(keyword)
        );

        const skillsScore = hasSkills ? 25 : 0;

        // Projects
        const hasProjects =
            lowerText.includes("projects") ||
            lowerText.includes("project");

        const projectsScore = hasProjects ? 25 : 0;

        // Education
        const hasEducation =
            lowerText.includes("education") ||
            lowerText.includes("b.tech") ||
            lowerText.includes("bachelor");

        const educationScore = hasEducation ? 20 : 0;

        // Experience
        const hasExperience =
            lowerText.includes("experience") ||
            lowerText.includes("internship");

        const experienceScore = hasExperience ? 15 : 0;

        // Contact information
        const hasEmail = /\S+@\S+\.\S+/.test(text);
        const hasPhone = /\+?\d[\d\s-]{8,}/.test(text);

        const contactScore =
            hasEmail && hasPhone ? 15 : hasEmail ? 10 : 0;

        // 4. Total score
        const totalScore =
            skillsScore +
            projectsScore +
            educationScore +
            experienceScore +
            contactScore;

        // 5. Suggestions
        const suggestions = [];

        if (!hasSkills) {
            suggestions.push(
                "Add a clear Technical Skills section."
            );
        }

        if (!hasProjects) {
            suggestions.push(
                "Add relevant projects with technologies used."
            );
        }

        if (!hasEducation) {
            suggestions.push(
                "Add your education details."
            );
        }

        if (!hasExperience) {
            suggestions.push(
                "Add internship or work experience if available."
            );
        }

        if (!hasEmail || !hasPhone) {
            suggestions.push(
                "Make sure your email and phone number are clearly visible."
            );
        }

        // 6. Send analysis
        res.status(200).json({
            message: "Resume analysis completed",

            resumeId: resume._id,

            score: totalScore,

            breakdown: {
                skills: skillsScore,
                projects: projectsScore,
                education: educationScore,
                experience: experienceScore,
                contact: contactScore
            },

            suggestions
        });

    } catch (error) {
        console.log(
            "Resume analysis error:",
            error.message
        );

        res.status(500).json({
            message: "Failed to analyze resume"
        });
    }
};