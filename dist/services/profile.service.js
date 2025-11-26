"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileService = getProfileService;
exports.updateProfileService = updateProfileService;
exports.updatePasswordService = updatePasswordService;
exports.resetPasswordService = resetPasswordService;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcrypt_1 = require("bcrypt");
const customError_1 = require("../utils/customError");
const nodemailer_1 = require("../helpers/nodemailer");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const handlebars_1 = require("handlebars");
const jsonwebtoken_1 = require("jsonwebtoken");
const env_config_1 = require("../config/env.config");
// ✅ 1. Get user profile
async function getProfileService(userId) {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
                profilePicture: true,
                refferalCode: true,
                point: true,
                createdAt: true,
            },
        });
        if (!user)
            throw (0, customError_1.createCustomError)(404, "User not found");
        return user;
    }
    catch (err) {
        throw err;
    }
}
// ✅ 2. Update user profile (tanpa password)
async function updateProfileService(userId, data) {
    try {
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                profilePicture: true,
                updatedAt: true,
            },
        });
        return updatedUser;
    }
    catch (err) {
        throw err;
    }
}
// ✅ 3. Update password (harus masukkan old password)
async function updatePasswordService(userId, oldPassword, newPassword) {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            throw (0, customError_1.createCustomError)(404, "User not found");
        const isValid = (0, bcrypt_1.compareSync)(oldPassword, user.password);
        if (!isValid)
            throw (0, customError_1.createCustomError)(401, "Old password is incorrect");
        const salt = (0, bcrypt_1.genSaltSync)(10);
        const hashed = (0, bcrypt_1.hashSync)(newPassword, salt);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { password: hashed },
        });
        return { message: "Password updated successfully" };
    }
    catch (err) {
        throw err;
    }
}
// ✅ 4. (Optional) Reset password via email
async function resetPasswordService(email) {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user)
            throw (0, customError_1.createCustomError)(404, "Email not registered");
        const token = (0, jsonwebtoken_1.sign)({ email }, env_config_1.SECRET_KEY, { expiresIn: "10m" });
        const templatePath = path_1.default.join(__dirname, "../templates/reset-password.hbs");
        const html = (0, handlebars_1.compile)(fs_1.default.readFileSync(templatePath, "utf-8"))({
            redirect_url: `${env_config_1.BASE_WEB_URL}/auth/reset-password?token=${token}`,
        });
        await nodemailer_1.transporter.sendMail({
            to: email,
            subject: "Reset Password",
            html,
        });
        return { message: "Reset password link sent to email" };
    }
    catch (err) {
        throw err;
    }
}
