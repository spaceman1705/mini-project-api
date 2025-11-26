"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = getUserByEmail;
exports.verificationLinkService = verificationLinkService;
exports.verifyService = verifyService;
exports.login = login;
const prisma_1 = __importDefault(require("../lib/prisma"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const handlebars_1 = require("handlebars");
const jsonwebtoken_1 = require("jsonwebtoken");
const bcrypt_1 = require("bcrypt");
const registerToken_service_1 = require("./registerToken.service");
const env_config_1 = require("../config/env.config");
const customError_1 = require("../utils/customError");
const nodemailer_1 = require("../helpers/nodemailer");
const nanoid_1 = require("nanoid");
async function getUserByEmail(email) {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: {
                email,
            },
        });
        return user;
    }
    catch (err) {
        throw err;
    }
}
async function verificationLinkService(email) {
    console.log("📩 verificationLinkService called with:", email);
    const targetPath = path_1.default.join(__dirname, "../templates", "registration.hbs");
    console.log("📂 Looking for template at:", targetPath);
    try {
        const user = await getUserByEmail(email);
        console.log("👤 getUserByEmail result:", user);
        if (user)
            throw (0, customError_1.createCustomError)(401, "User already exists");
        const payload = {
            email,
        };
        const token = (0, jsonwebtoken_1.sign)(payload, env_config_1.SECRET_KEY, { expiresIn: "5m" });
        console.log("🔑 Token generated:", token);
        await prisma_1.default.$transaction(async (tx) => {
            console.log("💾 Saving token...");
            await tx.registerToken.create({
                data: {
                    token,
                },
            });
            console.log("📖 Reading template...");
            const templateSrc = fs_1.default.readFileSync(targetPath, "utf-8");
            const compiledTemplate = (0, handlebars_1.compile)(templateSrc);
            const html = compiledTemplate({
                redirect_url: `${env_config_1.BASE_WEB_URL}/auth/verify?token=${token}`,
            });
            console.log("📧 Sending email to:", email);
            await nodemailer_1.transporter.sendMail({
                to: email,
                subject: "Registration",
                html,
            });
            console.log("✅ Email sent successfully!");
        });
    }
    catch (err) {
        console.error("❌ verificationLinkService ERROR:", err);
        throw err;
    }
}
async function verifyService(token, params) {
    try {
        const tokenExist = await (0, registerToken_service_1.getRegisterToken)(token);
        if (!tokenExist)
            throw (0, customError_1.createCustomError)(403, "Invalid Token");
        const user = await getUserByEmail(params.email);
        if (user)
            throw (0, customError_1.createCustomError)(401, "User already exists");
        const salt = (0, bcrypt_1.genSaltSync)(10);
        const hashedPassword = (0, bcrypt_1.hashSync)(params.password, salt);
        const newReferralCode = (0, nanoid_1.nanoid)(8).toUpperCase();
        await prisma_1.default.$transaction(async (tx) => {
            var _a;
            const newUser = await tx.user.create({
                data: {
                    firstname: params.firstname,
                    lastname: params.lastname,
                    email: params.email,
                    password: hashedPassword,
                    refferalCode: newReferralCode,
                    role: (_a = params.role) !== null && _a !== void 0 ? _a : "CUSTOMER",
                    isVerified: true,
                },
            });
            if (params.referralCodeUsed) {
                const referrer = await tx.user.findUnique({
                    where: { refferalCode: params.referralCodeUsed },
                });
                if (referrer) {
                    const points = 10000;
                    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                    await tx.point.create({
                        data: {
                            amount: points,
                            pointType: "EARNED",
                            description: "Referral Bonus",
                            expiredAt: expiresAt,
                            userId: referrer.id,
                        },
                    });
                    const voucherCode = `DISC-${Math.random()
                        .toString(36)
                        .substring(2, 8)
                        .toUpperCase()}`;
                    await tx.coupon.create({
                        data: {
                            userId: newUser.id,
                            code: voucherCode,
                            discountAmount: 5000,
                            expiredAt: expiresAt,
                        },
                    });
                }
            }
            await tx.registerToken.delete({
                where: { token },
            });
        });
    }
    catch (err) {
        throw err;
    }
}
async function login(email, password) {
    try {
        const user = await getUserByEmail(email);
        if (!user)
            throw (0, customError_1.createCustomError)(401, "Invalid email or password");
        const isValidPassword = (0, bcrypt_1.compareSync)(password, user.password);
        if (!isValidPassword)
            throw (0, customError_1.createCustomError)(401, "Invalid email or password");
        const payload = {
            id: user.id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role,
            refferalCode: user.refferalCode,
        };
        const accessToken = (0, jsonwebtoken_1.sign)(payload, env_config_1.SECRET_KEY, { expiresIn: "10m" });
        const refreshToken = (0, jsonwebtoken_1.sign)(payload, env_config_1.SECRET_KEY, { expiresIn: "30d" });
        return {
            accessToken,
            refreshToken,
        };
    }
    catch (err) {
        throw err;
    }
}
