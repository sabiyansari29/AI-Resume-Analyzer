import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        category: {
            type: String,
            enum: [
                "Programming Language",
                "Frontend",
                "Backend",
                "Database",
                "DevOps",
                "Tools",
                "AI/ML",
                "Other"
            ],
            default: "Other"
        },

        aliases: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

const Skill = mongoose.model("Skill", skillSchema);

export default Skill;