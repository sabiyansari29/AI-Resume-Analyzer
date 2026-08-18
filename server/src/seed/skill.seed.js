import mongoose from "mongoose";
import dotenv from "dotenv";
import Skill from "../models/skill.model.js";

// Load .env from server folder
dotenv.config({
    path: new URL("../../.env", import.meta.url)
});

const skills = [
    {
        name: "JavaScript",
        category: "Programming Language",
        aliases: ["JS", "Javascript"]
    },
    {
        name: "Java",
        category: "Programming Language",
        aliases: ["Core Java"]
    },
    {
        name: "Python",
        category: "Programming Language",
        aliases: ["Python3"]
    },
    {
        name: "C++",
        category: "Programming Language",
        aliases: ["CPP"]
    },
    {
        name: "React.js",
        category: "Frontend",
        aliases: ["React", "ReactJS"]
    },
    {
        name: "Next.js",
        category: "Frontend",
        aliases: ["NextJS", "Next"]
    },
    {
        name: "HTML",
        category: "Frontend",
        aliases: ["HTML5"]
    },
    {
        name: "CSS",
        category: "Frontend",
        aliases: ["CSS3"]
    },
    {
        name: "Tailwind CSS",
        category: "Frontend",
        aliases: ["Tailwind"]
    },
    {
        name: "Node.js",
        category: "Backend",
        aliases: ["Node", "NodeJS"]
    },
    {
        name: "Express.js",
        category: "Backend",
        aliases: ["Express", "ExpressJS"]
    },
    {
        name: "MongoDB",
        category: "Database",
        aliases: ["Mongo"]
    },
    {
        name: "MySQL",
        category: "Database",
        aliases: ["SQL"]
    },
    {
        name: "Git",
        category: "Tools",
        aliases: []
    },
    {
        name: "GitHub",
        category: "Tools",
        aliases: []
    },
    {
        name: "Postman",
        category: "Tools",
        aliases: []
    },
    {
        name: "Docker",
        category: "DevOps",
        aliases: []
    },
    {
        name: "AWS",
        category: "DevOps",
        aliases: ["Amazon Web Services"]
    },
    {
        name: "Machine Learning",
        category: "AI/ML",
        aliases: ["ML"]
    },
    {
        name: "Artificial Intelligence",
        category: "AI/ML",
        aliases: ["AI"]
    }
];

const seedSkills = async () => {
    try {
        // Check MongoDB URI
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not found in .env file");
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        // Remove old skills
        await Skill.deleteMany();

        // Insert skills
        await Skill.insertMany(skills);

        console.log("Skills inserted successfully");
        console.log(`Total skills inserted: ${skills.length}`);

        // Close connection
        await mongoose.connection.close();

        console.log("MongoDB connection closed");

        process.exit(0);

    } catch (error) {
        console.log("Seed error:", error.message);

        await mongoose.connection.close();

        process.exit(1);
    }
};

seedSkills();