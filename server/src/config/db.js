import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("mongodb connected succesfully");
    } catch (error) {
        console.log("db connection error:", error.message);
        process.exit(1);
    }
};

export default connectDB;