import prisma from "../lib/prisma";

export async function getRegisterToken(token: string) {
  return await prisma.registerToken.findUnique({
    where: {
      token,
    },
  });
}