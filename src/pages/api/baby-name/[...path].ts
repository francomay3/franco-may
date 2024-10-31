import z from "zod";
import * as database from "@/baby-name/database";
import { getStatus, Routes } from "@/baby-name/utils";
import { withAuth, validateBody } from "@/baby-name/middlewares";
import handler from "@/baby-name/handler";
import * as zt from "@/baby-name/zodSchemas";

const routes: Routes = {
  "create-poll": {
    method: "POST",
    handler: async (req, res) => {
      const { title, avatar, uid } = req.body;
      await database.createPoll({ uid, title, avatar });
      return getStatus("CREATED", res);
    },
    middlewares: [
      withAuth({ withSelfOnly: true }),
      validateBody(
        z.object({ title: zt.title, avatar: zt.avatar, uid: zt.uid })
      ),
    ],
  },

  "create-user": {
    method: "POST",
    handler: async (req, res) => {
      const { uid, name, avatar, email, subtitle } = req.body;
      await database.createUser({ uid, name, avatar, email, subtitle });
      return getStatus("CREATED", res);
    },
    middlewares: [
      validateBody(
        z.object({
          uid: zt.uid,
          name: zt.name,
          avatar: zt.avatar,
          email: zt.email,
          subtitle: zt.subtitle,
        })
      ),
    ],
  },

  "get-poll-details": {
    method: "POST",
    handler: async (req, res) => {
      const { pollId } = req.body;
      const data = await database.getPollDetails({ pollId });
      return getStatus("READ", res, data);
    },
    middlewares: [withAuth(), validateBody(z.object({ pollId: zt.pollId }))],
  },

  "get-user": {
    method: "POST",
    handler: async (req, res) => {
      const { uid } = req.body;
      const data = await database.getUser({ uid });
      data?.friendsTo;
      return getStatus("READ", res, data);
    },
    middlewares: [validateBody(z.object({ uid: zt.uid }))],
  },

  "get-users": {
    method: "POST",
    handler: async (req, res) => {
      const { uids } = req.body;
      const data = await database.getUsers({ uids });
      return getStatus("READ", res, data);
    },
    middlewares: [
      withAuth({ withSelfOnly: false, adminOnly: false }),
      validateBody(z.object({ uids: zt.uids })),
    ],
  },

  "update-profile": {
    method: "POST",
    handler: async (req, res) => {
      const { uid, name, subtitle, avatar } = req.body;
      await database.updateProfile({ uid, name, subtitle, avatar });
      return getStatus("UPDATED", res);
    },
    middlewares: [
      withAuth({ withSelfOnly: true }),
      validateBody(
        z.object({
          uid: zt.uid,
          name: zt.name.optional(),
          subtitle: zt.subtitle.optional(),
          avatar: zt.avatar.optional(),
        })
      ),
    ],
  },

  "delete-user": {
    method: "POST",
    handler: async (req, res) => {
      const { uid } = req.body;
      await database.deleteUser({ uid });
      return getStatus("DELETED", res);
    },
    middlewares: [
      withAuth({ withSelfOnly: true }),
      validateBody(z.object({ uid: zt.uid })),
    ],
  },

  "reset-database": {
    method: "POST",
    handler: async (req, res) => {
      await database.resetDatabase();
      return getStatus("DELETED", res);
    },
    // TODO: add admin middleware again
    // middlewares: [withAuth({ adminOnly: true })],
  },

  "search-users": {
    method: "POST",
    handler: async (req, res) => {
      const { query } = req.body;
      const data = await database.searchUsers({ query });
      return getStatus("READ", res, data);
    },
    middlewares: [validateBody(z.object({ query: zt.query }))],
  },
};

export default handler(routes);
