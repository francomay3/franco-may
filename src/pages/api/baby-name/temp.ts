import { NextApiRequest, NextApiResponse } from "next";
import admin from "@/config/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    return res.status(200).json({ decodedToken });

    // Your authenticated API logic here
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
