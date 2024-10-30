import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import admin from "@/config/firebase-admin";

const prisma = new PrismaClient();

// FUNCTIONS CREATE
export const createPoll = async ({
  uid,
  title,
  avatar,
}: {
  uid: string;
  title: string;
  avatar?: string;
}): Promise<void> => {
  await prisma.poll.create({
    data: {
      title,
      ownerId: uid,
      avatar: avatar || faker.image.avatar(),
    },
  });
};

export const createUser = async ({
  uid,
  name,
  avatar,
  email,
  subtitle,
}: {
  uid: string;
  name?: string;
  avatar?: string;
  email: string;
  subtitle?: string;
}): Promise<void> => {
  await prisma.user.create({
    data: {
      id: uid,
      name: name || faker.person.fullName(),
      avatar: avatar || faker.image.avatar(),
      email,
      subtitle: subtitle || faker.person.bio(),
    },
  });
};

// FUNCTIONS READ
export const getPollDetails = async ({ pollId }: { pollId: number }) => {
  return prisma.poll.findUnique({
    where: { id: pollId },
  });
};
export type Poll = Awaited<ReturnType<typeof getPollDetails>>;

export const getUser = async ({ uid }: { uid: string }) => {
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

export const getUsers = async ({ uids }: { uids: string[] }) => {
  return prisma.user.findMany({
    where: { id: { in: uids } },
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
export const deleteUser = async ({ uid }: { uid: string }): Promise<void> => {
  await prisma.user.delete({
    where: { id: uid },
  });
};
export const resetDatabase = async () => {
  const uids = await prisma.user.findMany();
  await prisma.$transaction([
    prisma.userPoll.deleteMany(),
    prisma.friendship.deleteMany(),
    prisma.poll.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  const result = await admin.auth().deleteUsers(uids.map((user) => user.id));
};
