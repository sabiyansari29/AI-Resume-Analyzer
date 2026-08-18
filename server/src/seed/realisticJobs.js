import mongoose from "mongoose";
import dotenv from "dotenv";
import Job from "../models/job.model.js";
import Skill from "../models/skill.model.js";

dotenv.config();

const skillsData = [
    {
        name: "Power BI",
        category: "Tools",
        aliases: ["PowerBI"]
    },
    {
        name: "Excel",
        category: "Tools",
        aliases: ["Microsoft Excel"]
    }
];

const jobsData = [
    {
        title: "MERN Stack Developer",
        company: "TechNova Solutions",

        description:
            "Looking for a MERN Stack Developer with experience in React.js, Node.js, Express.js, MongoDB and JavaScript. The developer will build responsive web applications and REST APIs.",

        skills: [
            "React.js",
            "Node.js",
            "Express.js",
            "MongoDB",
            "JavaScript"
        ],

        location: "Remote",
        jobType: "Full-time",

        applyUrl:
            "https://www.linkedin.com/jobs/search/?keywords=MERN%20Stack%20Developer"
    },

    {
        title: "Frontend Developer",
        company: "Creative Web Labs",

        description:
            "Frontend developer required with strong knowledge of React.js, JavaScript, HTML, CSS and Tailwind CSS. The role involves building responsive and user-friendly web interfaces.",

        skills: [
            "React.js",
            "JavaScript",
            "HTML",
            "CSS",
            "Tailwind CSS"
        ],

        location: "Lucknow",
        jobType: "Full-time",

        applyUrl:
            "https://www.linkedin.com/jobs/search/?keywords=Frontend%20Developer&location=Lucknow"
    },

    {
        title: "Software Developer Intern",
        company: "Startup Labs",

        description:
            "Internship opportunity for students interested in software development, programming and modern web technologies. Candidates will work on real-world software projects.",

        skills: [
            "JavaScript",
            "Git",
            "Java",
            "React.js",
            "SQL"
        ],

        location: "Remote",
        jobType: "Internship",

        applyUrl:
            "https://www.linkedin.com/jobs/search/?keywords=Software%20Developer%20Intern"
    },

    {
        title: "Python Developer",
        company: "AI Innovations",

        description:
            "Python developer required for backend development and artificial intelligence projects. Knowledge of Django, machine learning and AI technologies is preferred.",

        skills: [
            "Python",
            "Django",
            "Machine Learning",
            "Artificial Intelligence",
            "Git"
        ],

        location: "Bangalore",
        jobType: "Full-time",

        applyUrl:
            "https://www.linkedin.com/jobs/search/?keywords=Python%20Developer&location=Bangalore"
    },

    {
        title: "Data Analyst",
        company: "DataWorks India",

        description:
            "Data analyst required to work with datasets, dashboards and business intelligence tools. Candidates should have knowledge of Python, SQL, Power BI and Excel.",

        skills: [
            "Python",
            "SQL",
            "Power BI",
            "Excel"
        ],

        location: "Delhi",
        jobType: "Full-time",

        applyUrl:
            "https://www.linkedin.com/jobs/search/?keywords=Data%20Analyst&location=Delhi"
    }
];

const seedJobs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

        // ------------------------------------------
        // CREATE MISSING SKILLS
        // ------------------------------------------

        for (const skillData of skillsData) {
            const existingSkill = await Skill.findOne({
                name: skillData.name
            });

            if (!existingSkill) {
                await Skill.create(skillData);

                console.log(
                    `Created skill: ${skillData.name}`
                );
            } else {
                console.log(
                    `Skill already exists: ${skillData.name}`
                );
            }
        }

        // ------------------------------------------
        // DELETE OLD JOBS
        // ------------------------------------------

        await Job.deleteMany({
            company: {
                $in: [
                    "Tech Solutions",
                    "Startup Hub",
                    "AI Technologies",
                    "Web Innovations",
                    "ABC Technologies",
                    "TechNova Solutions",
                    "Creative Web Labs",
                    "Startup Labs",
                    "AI Innovations",
                    "DataWorks India"
                ]
            }
        });

        console.log("Old test jobs removed");

        // ------------------------------------------
        // CREATE NEW JOBS
        // ------------------------------------------

        for (const jobData of jobsData) {
            const skillIds = [];

            for (const skillName of jobData.skills) {
                const skill = await Skill.findOne({
                    name: skillName
                });

                if (skill) {
                    skillIds.push(skill._id);
                } else {
                    console.log(
                        `Skill not found: ${skillName}`
                    );
                }
            }

            await Job.create({
                title: jobData.title,
                company: jobData.company,
                description: jobData.description,
                requiredSkills: skillIds,
                location: jobData.location,
                jobType: jobData.jobType,
                applyUrl: jobData.applyUrl
            });

            console.log(
                `Created job: ${jobData.title}`
            );
        }

        console.log("");
        console.log("==========================================");
        console.log("Realistic jobs created successfully!");
        console.log("Apply URLs added successfully!");
        console.log("==========================================");

        process.exit(0);
    } catch (error) {
        console.error("Seed error:", error);

        process.exit(1);
    }
};

seedJobs();