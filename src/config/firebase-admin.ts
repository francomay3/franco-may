import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.BABY_NAME_FIREBASE_PROJECT_ID,
      clientEmail: process.env.BABY_NAME_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.BABY_NAME_FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
    }),
  });
}

const adminApp = admin;
export default adminApp;
