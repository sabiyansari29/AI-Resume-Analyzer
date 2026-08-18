import mongoose from "mongoose";
import dotenv from "dotenv";

import Job from "../models/job.model.js";
import Skill from "../models/skill.model.js";

dotenv.config({
    path: new URL("../../.env", import.meta.url)
});

const seedJobs = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        // Get skills from database
        const skills = await Skill.find();

        // Helper function to find Skill ID
        const getSkillId = (skillName) => {
            const skill = skills.find(
                (item) =>
                    item.name.toLowerCase() === skillName.toLowerCase()
            );

            return skill?._id;
        };

        const jobs = [
            {
                title: "MERN Stack Developer",
                company: "Tech Solutions",
                description:
                    "Looking for a MERN Stack Developer with experience in React.js, Node.js, Express.js and MongoDB.",
                requiredSkills: [
                    getSkillId("React.js"),
                    getSkillId("Node.js"),
                    getSkillId("Express.js"),
                    getSkillId("MongoDB"),
                    getSkillId("JavaScript")
                ].filter(Boolean),
                location: "Remote",
                jobType: "Full-time"
            },

            {
                title: "Frontend Developer",
                company: "Web Innovations",
                description:
                    "Frontend Developer required with strong knowledge of React.js, JavaScript, HTML, CSS and Tailwind CSS.",
                requiredSkills: [
                    getSkillId("React.js"),
                    getSkillId("JavaScript"),
                    getSkillId("HTML"),
                    getSkillId("CSS"),
                    getSkillId("Tailwind CSS")
                ].filter(Boolean),
                location: "Lucknow",
                jobType: "Full-time"
            },

            {
                title: "Python Developer",
                company: "AI Technologies",
                description:
                    "Python Developer required for backend and AI related development.",
                requiredSkills: [
                    getSkillId("Python"),
                    getSkillId("Machine Learning"),
                    getSkillId("Artificial Intelligence"),
                    getSkillId("Git")
                ].filter(Boolean),
                location: "Bangalore",
                jobType: "Full-time"
            },

            {
                title: "Software Developer Intern",
                company: "Startup Hub",
                description:
                    "Software development internship for students with knowledge of programming, Git and web technologies.",
                requiredSkills: [
                    getSkillId("JavaScript"),
                    getSkillId("Java"),
                    getSkillId("Git"),
                    getSkillId("React.js")
                ].filter(Boolean),
                location: "Remote",
                jobType: "Internship"
            }
        ];

        await Job.deleteMany();

        await Job.insertMany(jobs);

        console.log("Jobs inserted successfully");
        console.log(`Total jobs inserted: ${jobs.length}`);

        await mongoose.connection.close();

        console.log("MongoDB connection closed");

        process.exit(0);

    } catch (error) {
        console.log("Job seed error:", error.message);

        await mongoose.connection.close();

        process.exit(1);
    }
};

seedJobs();