import prisma from "./prisma";

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function eventSlug(title: string): Promise<string> {
  const base = toSlug(title);
  let slug = base;
  let i = 1;

  while (
    await prisma.event.findUnique({
      where: { slug },
    })
  ) {
    i++;
    slug = `${base}-${i}`;
  }

  return slug;
}
