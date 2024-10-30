import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import admin from "@/config/firebase-admin";
import * as database from "@/baby-name/database";

type MiddlewareFunction = (handler: NextApiHandler) => NextApiHandler;

const compose = (...middlewares: MiddlewareFunction[]) => {
  return (handler: NextApiHandler): NextApiHandler => {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc);
    }, handler);
  };
};

type WithAuthOptions = {
  withSelfOnly?: boolean;
  adminOnly?: boolean;
};

const withAuth: (options?: WithAuthOptions) => MiddlewareFunction = (
  options = {}
) => {
  const { withSelfOnly, adminOnly } = options || {};

  return (handler) => {
    return async (req, res) => {
      const token = req.headers.authorization?.split("Bearer ")[1];

      if (!token) {
        return res.status(401).json({ error: "no token provided" });
      }

      try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        if (!decodedToken) {
          return res.status(401).json({ error: "invalid token" });
        }

        // Add the decoded token to the request object so handlers can access it
        const email = decodedToken.email || "";
        const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
        const isAdmin = adminEmails?.includes(email) || false;

        if (adminOnly && !isAdmin) {
          return res
            .status(403)
            .json({ error: "only admins can perform this action" });
        }

        const decodedUid = decodedToken.uid;
        const requestedUid = req.body.uid;
        const isActingOnOwnData = decodedUid === requestedUid;

        if (!isAdmin && withSelfOnly && !isActingOnOwnData) {
          return res
            .status(403)
            .json({ error: "you can only modify your own data" });
        }

        return handler(req, res);
      } catch (error) {
        return res.status(401).json({ error: "invalid token" });
      }
    };
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type"
    );
    return res.status(200).end();
  }

  const path = req.query.path as string[];

  try {
    switch (path[0]) {
      case "create-poll": {
        return compose(
          withAuth({
            withSelfOnly: true,
          })
        )(async (req, res) => {
          const { title, avatar, uid } = req.body;
          await database.createPoll({ uid, title, avatar });
          return res.status(201).json({ success: true });
        })(req, res);
      }

      case "create-user": {
        const { uid, name, avatar, email, subtitle } = req.body;
        await database.createUser({
          uid,
          name,
          avatar,
          email,
          subtitle,
        });
        return res.status(201).json({ success: true });
      }

      case "get-poll-details": {
        return compose(withAuth())(async (req, res) => {
          const { pollId } = req.body;
          const response = await database.getPollDetails({ pollId });
          return res.status(201).json(response);
        })(req, res);
      }

      case "get-user": {
        const { uid } = req.body;
        const response = await database.getUser({ uid });
        return res.status(200).json(response);
      }

      case "get-users": {
        return compose(
          withAuth({
            withSelfOnly: false,
            adminOnly: false,
          })
        )(async (req, res) => {
          const { uids } = req.body;
          const response = await database.getUsers({ uids });
          return res.status(201).json(response);
        })(req, res);
      }

      case "update-profile": {
        return compose(
          withAuth({
            withSelfOnly: true,
          })
        )(async (req, res) => {
          const { uid, name, subtitle, avatar } = req.body;
          await database.updateProfile({
            uid,
            name,
            subtitle,
            avatar,
          });
          return res.status(201).json({ success: true });
        })(req, res);
      }

      case "delete-user": {
        return compose(
          withAuth({
            withSelfOnly: true,
            adminOnly: true,
          })
        )(async (req, res) => {
          const { uid } = req.body;
          await database.deleteUser({ uid });
          return res.status(201).json({ success: true });
        })(req, res);
      }

      // case "reset-database": {
      //   return compose(
      //     withAuth({
      //       adminOnly: true,
      //     })
      //   )(async (req, res) => {
      //     await database.resetDatabase();
      //     return res.status(201).json({ success: true });
      //   })(req, res);
      // }

      case "reset-database": {
        return compose()(async (req, res) => {
          await database.resetDatabase();
          return res.status(201).json({ success: true });
        })(req, res);
      }

      default: {
        return res.status(404).json({ error: "Endpoint not found" });
      }
    }
  } catch (error) {
    return res.status(500).json(error);
  }
}
