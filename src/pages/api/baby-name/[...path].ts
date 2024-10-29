// TODO: manage permissions

import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import admin from "@/config/firebase-admin";
import * as database from "@/baby-name/database";

const cors = Cors({
  methods: ["GET", "POST"],
  origin: "*",
  credentials: true,
});

const runMiddleware = (
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (
    req: NextApiRequest,
    res: NextApiResponse,
    callback: (result: any) => void
  ) => void
) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await runMiddleware(req, res, cors);

    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    const path = req.query.path as string[];

    switch (path[0]) {
      case "create-poll":
        try {
          const pollCreation = database.createPoll(
            decodedToken.uid,
            req.body.title,
            req.body.avatar
          );
          return res.status(200).json(pollCreation);
        } catch (error) {
          return res.status(500).json(error);
        }

      case "create-user":
        try {
          const userCreation = database.createUser({
            id: decodedToken.uid,
            ...req.body,
          });
          return res.status(200).json(userCreation);
        } catch (error) {
          return res.status(500).json(error);
        }

      case "get-poll-details":
        try {
          const poll = await database.getPollDetails(req.body.id);
          return res.status(200).json(poll);
        } catch (error) {
          return res.status(500).json(error);
        }

      case "get-user":
        try {
          const user = await database.getUser(req.body.id);
          return res.status(200).json(user);
        } catch (error) {
          return res.status(500).json(error);
        }

      case "get-users":
        try {
          const users = await database.getUsers(req.body.ids);
          return res.status(200).json(users);
        } catch (error) {
          return res.status(500).json(error);
        }

      case "update-profile":
        try {
          const userUpdate = await database.updateProfile(req.body);
          return res.status(200).json(userUpdate);
        } catch (error) {
          return res.status(500).json(error);
        }

      case "delete-user":
        try {
          const userDelete = await database.deleteUser(decodedToken.uid);
          return res.status(200).json(userDelete);
        } catch (error) {
          return res.status(500).json(error);
        }

      default:
        return res.status(404).json({ error: "Endpoint not found" });
    }
  } catch (error) {
    return res.status(500).json(error);
  }
}
