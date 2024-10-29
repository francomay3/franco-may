import { NextApiRequest, NextApiResponse } from "next";
import admin from "@/config/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    console.log(decodedToken);

    // Your authenticated API logic here
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
