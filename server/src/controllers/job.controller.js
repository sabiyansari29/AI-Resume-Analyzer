import Job from "../models/job.model.js";

// ==========================================
// CREATE JOB
// ==========================================
export const createJob = async (req, res) => {
    try {
        const {
            title,
            company,
            description,
            requiredSkills,
            location,
            jobType,
            applyUrl
        } = req.body;

        if (!title || !company || !description) {
            return res.status(400).json({
                message: "Title, company and description are required"
            });
        }

        const job = await Job.create({
            title,
            company,
            description,
            requiredSkills: requiredSkills || [],
            location: location || "Remote",
            jobType: jobType || "Full-time",
            applyUrl: applyUrl || ""
        });

        const populatedJob = await Job.findById(job._id)
            .populate("requiredSkills");

        return res.status(201).json({
            message: "Job created successfully",
            job: populatedJob
        });

    } catch (error) {
        console.log("Create job error:", error.message);

        return res.status(500).json({
            message: "Failed to create job",
            error: error.message
        });
    }
};


// ==========================================
// GET ALL JOBS
// ==========================================
export const getJobs = async (req, res) => {
    try {
        const {
            search,
            location,
            jobType
        } = req.query;

        const filter = {};

        // SEARCH
        if (search && search.trim() !== "") {
            filter.$or = [
                {
                    title: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },
                {
                    company: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                }
            ];
        }

        // LOCATION
        if (
            location &&
            location.trim() !== "" &&
            location !== "All"
        ) {
            filter.location = {
                $regex: location.trim(),
                $options: "i"
            };
        }

        // JOB TYPE
        if (
            jobType &&
            jobType.trim() !== "" &&
            jobType !== "All"
        ) {
            filter.jobType = jobType;
        }

        const jobs = await Job.find(filter)
            .populate("requiredSkills")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Jobs fetched successfully",
            totalJobs: jobs.length,
            jobs
        });

    } catch (error) {
        console.log("Get jobs error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch jobs",
            error: error.message
        });
    }
};


// ==========================================
// GET SINGLE JOB
// ==========================================
export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id)
            .populate("requiredSkills");

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        return res.status(200).json({
            message: "Job fetched successfully",
            job
        });

    } catch (error) {
        console.log("Get job error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch job",
            error: error.message
        });
    }
};


// ==========================================
// UPDATE JOB
// ==========================================
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            company,
            description,
            requiredSkills,
            location,
            jobType,
            applyUrl
        } = req.body;

        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        if (title !== undefined) {
            job.title = title;
        }

        if (company !== undefined) {
            job.company = company;
        }

        if (description !== undefined) {
            job.description = description;
        }

        if (requiredSkills !== undefined) {
            job.requiredSkills = requiredSkills;
        }

        if (location !== undefined) {
            job.location = location;
        }

        if (jobType !== undefined) {
            job.jobType = jobType;
        }

        if (applyUrl !== undefined) {
            job.applyUrl = applyUrl;
        }

        await job.save();

        const updatedJob = await Job.findById(job._id)
            .populate("requiredSkills");

        return res.status(200).json({
            message: "Job updated successfully",
            job: updatedJob
        });

    } catch (error) {
        console.log("Update job error:", error.message);

        return res.status(500).json({
            message: "Failed to update job",
            error: error.message
        });
    }
};


// ==========================================
// DELETE JOB
// ==========================================
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findByIdAndDelete(id);

        if (!job) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        return res.status(200).json({
            message: "Job deleted successfully"
        });

    } catch (error) {
        console.log("Delete job error:", error.message);

        return res.status(500).json({
            message: "Failed to delete job",
            error: error.message
        });
    }
};