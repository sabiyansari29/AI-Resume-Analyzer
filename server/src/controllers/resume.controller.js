import fs from "fs";
import { PDFParse } from "pdf-parse";
import Resume from "../models/resume.model.js";

export const uploadResume = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a PDF resume"
            });
        }

        // Read uploaded PDF
        const pdfBuffer = fs.readFileSync(req.file.path);

        // Create PDF parser
        const parser = new PDFParse({
            data: pdfBuffer
        });

        // Extract text
        const result = await parser.getText();

        const resumeText = result.text;

        // Destroy parser
        await parser.destroy();

        // Save resume in MongoDB
        const resume = await Resume.create({
            user: req.user.userId,
            originalName: req.file.originalname,
            fileName: req.file.filename,
            filePath: req.file.path,
            resumeText: resumeText
        });

        res.status(201).json({
            message: "Resume uploaded and saved successfully",
            resume: {
                id: resume._id,
                originalName: resume.originalName,
                fileName: resume.fileName,
                resumeText: resume.resumeText
            }
        });

    } catch (error) {
        console.log("Resume processing error:", error.message);

        res.status(500).json({
            message: "Failed to process resume"
        });
    }
};