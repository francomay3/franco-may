import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// FUNCTIONS CREATE
export const createPoll = async (
  uid: string,
  title: string,
  avatar?: string
): Promise<void> => {
  await prisma.poll.create({
    data: {
      title,
      ownerId: uid,
      avatar: avatar || faker.image.avatar(),
    },
  });
};

export const createUser = async ({
  id,
  name,
  avatar,
  email,
  subtitle,
}: {
  id: string;
  name?: string;
  avatar?: string;
  email: string;
  subtitle?: string;
}): Promise<void> => {
  await prisma.user.create({
    data: {
      id,
      name: name || faker.person.fullName(),
      avatar: avatar || faker.image.avatar(),
      email,
      subtitle: subtitle || faker.person.bio(),
    },
  });
};

// FUNCTIONS READ
export const getPollDetails = async (id: number) => {
  return prisma.poll.findUnique({
    where: { id },
  });
};
export type Poll = Awaited<ReturnType<typeof getPollDetails>>;

export const getUser = async (uid: string) => {
  return prisma.user.findUnique({
    where: { id: uid },
    include: {
      polls: true,
      participatedPolls: true,
      friendsTo: true,
      friendsFrom: true,
    },
  });
};
export type User = Awaited<ReturnType<typeof getUser>>;

export const getUsers = async (ids: string[]) => {
  return prisma.user.findMany({
    where: { id: { in: ids } },
    include: {
      polls: true,
      participatedPolls: true,
      friendsTo: true,
      friendsFrom: true,
    },
  });
};
export type Users = Awaited<ReturnType<typeof getUsers>>;

// FUNCTIONS UPDATE
export const updateProfile = async ({
  uid,
  name,
  subtitle,
  avatar,
}: {
  uid: string;
  name?: string;
  subtitle?: string;
  avatar?: string;
}): Promise<void> => {
  await prisma.user.update({
    where: { id: uid },
    data: {
      name,
      subtitle,
      avatar,
    },
  });
};

// FUNCTIONS DELETE
export const deleteUser = async (uid: string): Promise<void> => {
  await prisma.user.delete({
    where: { id: uid },
  });
};
