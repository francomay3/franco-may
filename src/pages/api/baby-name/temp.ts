import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import admin from "@/config/firebase-admin";

// Initialize the cors middleware
const cors = Cors({
  methods: ["GET", "POST"], // Add the HTTP methods you need
  origin: "*", // Be more restrictive in production
  credentials: true,
});

// Helper method to wait for middleware
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

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    return res.status(200).json({ decodedToken });

    // Your authenticated API logic here
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
