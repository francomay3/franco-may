// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyAZIvYvVWdCjAWwUYYaUeAz9-n-wZQeaPg",
  authDomain: "franco-may.firebaseapp.com",
  projectId: "franco-may",
  storageBucket: "franco-may.appspot.com",
  messagingSenderId: "1044809313252",
  appId: "1:1044809313252:web:d8283b4b02d206bca1f5f1",
  databaseURL:
    "https://franco-may-default-rtdb.europe-west1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getDatabase(app);
export const auth = getAuth();
export const provider = new GoogleAuthProvider();
