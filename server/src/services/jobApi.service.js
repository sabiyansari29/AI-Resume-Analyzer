import axios from "axios";

const JOB_API_URL = "https://api.indianapi.in/jobs";

export const fetchJobsFromIndianAPI = async () => {
    try {
        const response = await axios.get(JOB_API_URL, {
            headers: {
                "X-Api-Key": process.env.INDIAN_API_KEY
            }
        });

        return response.data;

    } catch (error) {
        console.log(
            "Indian Jobs API error:",
            error.response?.data || error.message
        );

        throw new Error("Failed to fetch jobs from Indian API");
    }
};