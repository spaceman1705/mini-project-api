"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.roleGuard = roleGuard;
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = require("jsonwebtoken");
const jsonwebtoken_2 = __importDefault(require("jsonwebtoken"));
const customError_1 = require("../utils/customError");
const env_config_1 = require("../config/env.config");
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer "))
            throw (0, customError_1.createCustomError)(401, "Unauthorized");
        const token = authHeader.split(" ")[1];
        const decoded = (0, jsonwebtoken_1.verify)(token, env_config_1.SECRET_KEY);
        req.user = decoded;
        next();
    }
    catch (err) {
        next(err);
    }
}
function roleGuard(allowedRoles) {
    return (req, res, next) => {
        var _a;
        console.log("🟡 roleGuard executing for roles:", allowedRoles);
        console.log("🟡 User role:", (_a = req.user) === null || _a === void 0 ? void 0 : _a.role);
        try {
            const user = req.user;
            if (!user) {
                console.log("❌ No user in request");
                throw (0, customError_1.createCustomError)(401, "invalid token");
            }
            if (!allowedRoles.includes(user === null || user === void 0 ? void 0 : user.role)) {
                console.log("❌ User role not in allowed roles");
                throw (0, customError_1.createCustomError)(401, "Insufficient permissions");
            }
            console.log("✅ Role guard passed");
            next();
        }
        catch (err) {
            console.error("❌ Role guard error:", err);
            next(err);
        }
    };
}
function authenticateToken(req, res, next) {
    console.log("🟢 authenticateToken executing...");
    try {
        const authHeader = req.headers.authorization;
        console.log("Auth header exists:", !!authHeader);
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            console.log("❌ No token provided");
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const decoded = jsonwebtoken_2.default.verify(token, env_config_1.SECRET_KEY);
        req.user = {
            id: decoded.id || decoded.email,
            email: decoded.email,
            firstname: decoded.firstname,
            lastname: decoded.lastname,
            role: decoded.role,
        };
        console.log("✅ Token verified, user:", req.user.email, "role:", req.user.role);
        next();
    }
    catch (error) {
        console.error("❌ authenticateToken error:", error);
        if (error instanceof jsonwebtoken_2.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        if (error instanceof jsonwebtoken_2.default.JsonWebTokenError) {
            res.status(403).json({ error: 'Invalid token' });
            return;
        }
        res.status(500).json({ error: 'Internal server error' });
    }
}
