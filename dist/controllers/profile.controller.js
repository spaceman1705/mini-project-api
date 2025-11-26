"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileController = getProfileController;
exports.updateProfileController = updateProfileController;
exports.updatePasswordController = updatePasswordController;
const profile_service_1 = require("../services/profile.service");
async function getProfileController(req, res, next) {
    try {
        if (!req.user)
            throw new Error("User not authenticated");
        const userId = req.user.id;
        const result = await (0, profile_service_1.getProfileService)(userId);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function updateProfileController(req, res, next) {
    try {
        if (!req.user)
            throw new Error("User not authenticated");
        const userId = req.user.id;
        const result = await (0, profile_service_1.updateProfileService)(userId, req.body);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function updatePasswordController(req, res, next) {
    try {
        if (!req.user)
            throw new Error("User not authenticated");
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;
        const result = await (0, profile_service_1.updatePasswordService)(userId, oldPassword, newPassword);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
