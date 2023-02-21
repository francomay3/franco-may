// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth, logInWithPopup, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyAZIvYvVWdCjAWwUYYaUeAz9-n-wZQeaPg",
  authDomain: "franco-may.firebaseapp.com",
  projectId: "franco-may",
  storageBucket: "franco-may.appspot.com",
  messagingSenderId: "1044809313252",
  appId: "1:1044809313252:web:d8283b4b02d206bca1f5f1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const provider = new GoogleAuthProvider();
