import { Prisma, PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma";
import path from "path";
import fs from "fs";
import { compile } from "handlebars";
import { sign } from "jsonwebtoken";
import { genSaltSync, hashSync, compareSync } from "bcrypt";

import { getRegisterToken } from "./registerToken.service";
import { BASE_WEB_URL, SECRET_KEY } from "../config/env.config";
import { createCustomError } from "../utils/customError";
import { transporter } from "../helpers/nodemailer";
import { nanoid } from "nanoid";

export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  } catch (err) {
    throw err;
  }
}

export async function verificationLinkService(email: string) {
  console.log("📩 verificationLinkService called with:", email);
  const targetPath = path.join(__dirname, "../templates", "registration.hbs");
  console.log("📂 Looking for template at:", targetPath);
  try {
    const user = await getUserByEmail(email);
    console.log("👤 getUserByEmail result:", user);

    if (user) throw createCustomError(401, "User already exists");
    const payload = {
      email,
    };

    const token = sign(payload, SECRET_KEY, { expiresIn: "5m" });
    console.log("🔑 Token generated:", token);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      console.log("💾 Saving token...");
      await tx.registerToken.create({
        data: {
          token,
        },
      });

      console.log("📖 Reading template...");
      const templateSrc = fs.readFileSync(targetPath, "utf-8");
      const compiledTemplate = compile(templateSrc);

      const html = compiledTemplate({
        redirect_url: `${BASE_WEB_URL}/auth/verify?token=${token}`,
      });

      console.log("📧 Sending email to:", email);
      await transporter.sendMail({
        to: email,
        subject: "Registration",
        html,
      });
      console.log("✅ Email sent successfully!");
    });
  } catch (err) {
    console.error("❌ verificationLinkService ERROR:", err);
    throw err;
  }
}

export async function verifyService(
  token: string,
  params: Prisma.UserCreateInput & { referralCodeUsed?: string }
) {
  try {
    const tokenExist = await getRegisterToken(token);
    if (!tokenExist) throw createCustomError(403, "Invalid Token");

    const user = await getUserByEmail(params.email);
    if (user) throw createCustomError(401, "User already exists");

    const salt = genSaltSync(10);
    const hashedPassword = hashSync(params.password, salt);

    const newReferralCode: string = nanoid(8).toUpperCase();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          firstname: params.firstname,
          lastname: params.lastname,
          email: params.email,
          password: hashedPassword,
          refferalCode: newReferralCode,
          role: params.role ?? "CUSTOMER",
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
  } catch (err) {
    throw err;
  }
}

export async function login(email: string, password: string) {
  try {
    const user = await getUserByEmail(email);

    if (!user) throw createCustomError(401, "Invalid email or password");

    const isValidPassword = compareSync(password, user.password);

    if (!isValidPassword)
      throw createCustomError(401, "Invalid email or password");

    const payload = {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
    };

    const accessToken = sign(payload, SECRET_KEY, { expiresIn: "10m" });
    const refreshToken = sign(payload, SECRET_KEY, { expiresIn: "30d" });

    return {
      accessToken,
      refreshToken,
    };
  } catch (err) {
    throw err;
  }
}
