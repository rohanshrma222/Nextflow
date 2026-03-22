import prisma from '@/lib/prisma'

export async function ensureDbUser(userId: string) {
  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  })
}
