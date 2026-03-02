import { auth } from "./backend.js"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"

const form = document.getElementById("auth-form")
const usernameInput = document.getElementById("username")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const errorBox = document.getElementById("auth-error")
const googleButton = document.getElementById("google-login")

const provider = new GoogleAuthProvider()

function redirectToFeed() {
  window.location.href = "feed.html"
}

onAuthStateChanged(auth, (user) => {
  if (user) redirectToFeed()
})

form.addEventListener("submit", async (e) => {
  e.preventDefault()
  errorBox.textContent = ""

  const email = emailInput.value
  const password = passwordInput.value

  if (!email || !password) {
    errorBox.textContent = "Bitte E-Mail und Passwort eingeben"
    return
  }

  try {
    await signInWithEmailAndPassword(auth, email, password)
  } catch {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      errorBox.textContent = err.message
    }
  }
})

googleButton.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider)
  } catch (err) {
    errorBox.textContent = err.message
  }
})
