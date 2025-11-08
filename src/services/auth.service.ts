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
  const targetPath = path.join(__dirname, "../templates", "registration.hbs");
  try {
    const user = await getUserByEmail(email);
    if (user) throw createCustomError(401, "User already exists");
    const payload = {
      email,
    };

    const token = sign(payload, SECRET_KEY, { expiresIn: "5m" });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.registerToken.create({
        data: {
          token,
        },
      });

      const templateSrc = fs.readFileSync(targetPath, "utf-8");
      const compiledTemplate = compile(templateSrc);

      const html = compiledTemplate({
        redirect_url: `${BASE_WEB_URL}/auth/verify?token=${token}`,
      });

      await transporter.sendMail({
        to: email,
        subject: "Registration",
        html,
      });
    });
  } catch (err) {
    throw err;
  }
}

export async function verifyService(
  token: string,
  params: Prisma.UserCreateInput
) {
  try {
    const tokenExist = await getRegisterToken(token);
    if (!tokenExist) throw createCustomError(403, "Invalid Token");

    const user = await getUserByEmail(params.email);
    if (user) throw createCustomError(401, "User already exists");

    const salt = genSaltSync(10);
    const hashedPassword = hashSync(params.password, salt);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.create({
        data: {
          ...params,
          password: hashedPassword,
        },
      });

      await tx.registerToken.delete({
        where: {
          token,
        },
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
