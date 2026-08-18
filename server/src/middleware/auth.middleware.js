import jwt from "jsonwebtoken";


// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // No Authorization header
        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization token is required"
            });
        }

        // Check Bearer format
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token is missing"
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Get user ID from token
        const userId =
            decoded.userId ||
            decoded.id ||
            decoded._id;

        if (!userId) {
            return res.status(401).json({
                message: "Invalid token: user ID not found"
            });
        }

        // Store user information
        req.user = {
            userId: userId
        };

        next();

    } catch (error) {

        console.log(
            "Authentication error:",
            error.message
        );

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};


// ==========================================
// NAMED EXPORT
// Existing resume.routes.js uses:
// import { protect } ...
// ==========================================
export const protect = authMiddleware;


// ==========================================
// DEFAULT EXPORT
// job.routes.js uses:
// import authMiddleware ...
// ==========================================
export default authMiddleware;