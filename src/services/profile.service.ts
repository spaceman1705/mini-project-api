import prisma from "../lib/prisma";
import { genSaltSync, hashSync, compareSync } from "bcrypt";
import { createCustomError } from "../utils/customError";
import { transporter } from "../helpers/nodemailer";
import path from "path";
import fs from "fs";
import { compile } from "handlebars";
import { sign } from "jsonwebtoken";
import { SECRET_KEY, BASE_WEB_URL } from "../config/env.config";

// ✅ 1. Get user profile
export async function getProfileService(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        user_img: true,
        referralCode: true,
        pointsBalance: true,
        createdAt: true,
      },
    });

    if (!user) throw createCustomError(404, "User not found");
    return user;
  } catch (err) {
    throw err;
  }
}

// ✅ 2. Update user profile (tanpa password)
export async function updateProfileService(
  userId: string,
  data: { firstname?: string; lastname?: string; user_img?: string }
) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        user_img: true,
        updatedAt: true,
      },
    });
    return updatedUser;
  } catch (err) {
    throw err;
  }
}

// ✅ 3. Update password (harus masukkan old password)
export async function updatePasswordService(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw createCustomError(404, "User not found");

    const isValid = compareSync(oldPassword, user.password);
    if (!isValid) throw createCustomError(401, "Old password is incorrect");

    const salt = genSaltSync(10);
    const hashed = hashSync(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: "Password updated successfully" };
  } catch (err) {
    throw err;
  }
}

// ✅ 4. (Optional) Reset password via email
export async function resetPasswordService(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw createCustomError(404, "Email not registered");

    const token = sign({ email }, SECRET_KEY, { expiresIn: "10m" });

    const templatePath = path.join(__dirname, "../templates/reset-password.hbs");
    const html = compile(fs.readFileSync(templatePath, "utf-8"))({
      redirect_url: `${BASE_WEB_URL}/auth/reset-password?token=${token}`,
    });

    await transporter.sendMail({
      to: email,
      subject: "Reset Password",
      html,
    });

    return { message: "Reset password link sent to email" };
  } catch (err) {
    throw err;
  }
}
