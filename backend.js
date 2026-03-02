import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyAl7eGAb8vvML5JvOfGo5MJfBuk2AVDQRs",
  authDomain: "obscura-18f0f.firebaseapp.com",
  projectId: "obscura-18f0f",
  storageBucket: "obscura-18f0f.firebasestorage.app",
  messagingSenderId: "1006181121284",
  appId: "1:1006181121284:web:e70489092a67466c792451"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
