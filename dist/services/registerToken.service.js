"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegisterToken = getRegisterToken;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getRegisterToken(token) {
    return await prisma_1.default.registerToken.findUnique({
        where: {
            token,
        },
    });
}
