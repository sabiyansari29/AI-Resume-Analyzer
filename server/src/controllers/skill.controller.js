import Skill from "../models/skill.model.js";


// ========================================
// CREATE SKILL
// ========================================

export const createSkill = async (req, res) => {
    try {
        const {
            name,
            category,
            aliases
        } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Skill name is required"
            });
        }

        const existingSkill = await Skill.findOne({
            name: name.trim()
        });

        if (existingSkill) {
            return res.status(409).json({
                message: "Skill already exists"
            });
        }

        const skill = await Skill.create({
            name: name.trim(),
            category: category || "Other",
            aliases: aliases || []
        });

        res.status(201).json({
            message: "Skill created successfully",
            skill
        });

    } catch (error) {
        console.log("Create skill error:", error.message);

        res.status(500).json({
            message: "Failed to create skill"
        });
    }
};


// ========================================
// GET ALL SKILLS
// ========================================

export const getAllSkills = async (req, res) => {
    try {
        const skills = await Skill.find()
            .sort({ name: 1 });

        res.status(200).json({
            message: "Skills fetched successfully",
            totalSkills: skills.length,
            skills
        });

    } catch (error) {
        console.log("Get skills error:", error.message);

        res.status(500).json({
            message: "Failed to fetch skills"
        });
    }
};


export default {
    createSkill,
    getAllSkills
};