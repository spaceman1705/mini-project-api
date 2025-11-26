"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTokenMiddleware = registerTokenMiddleware;
const jsonwebtoken_1 = require("jsonwebtoken");
const customError_1 = require("../utils/customError");
const env_config_1 = require("../config/env.config");
function registerTokenMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        console.log("🟡 [registerTokenMiddleware] Incoming verify request...");
        console.log("🔹 Authorization Header:", authHeader);
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw (0, customError_1.createCustomError)(401, "Unauthorized");
        }
        const token = authHeader.split(" ")[1];
        console.log("🔑 Extracted Token:", token);
        const decoded = (0, jsonwebtoken_1.verify)(token, env_config_1.SECRET_KEY);
        console.log("🧩 Decoded Payload:", decoded);
        if (!(decoded === null || decoded === void 0 ? void 0 : decoded.email)) {
            console.log("❌ Invalid or expired token payload");
            throw (0, customError_1.createCustomError)(403, "Invalid or expired token");
        }
        req.registerUser = decoded;
        next();
    }
    catch (err) {
        console.error("🚨 registerTokenMiddleware ERROR:", err);
        next(err);
    }
}
