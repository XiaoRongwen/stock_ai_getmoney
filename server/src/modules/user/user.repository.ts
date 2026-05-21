import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findByUsername = (username: string) =>
  prisma.user.findUnique({ where: { username } });

export const findById = (id: number) =>
  prisma.user.findUnique({ where: { id } });

export const createUser = (data: { username: string; password: string; role?: string }) =>
  prisma.user.create({ data });

export const findAllUsers = () =>
  prisma.user.findMany({ select: { id: true, username: true, role: true, createdAt: true } });
