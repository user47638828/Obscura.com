import { auth } from "./backend.js"

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"

const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const phoneInput = document.getElementById("phone")
const smsInput = document.getElementById("sms-code")

const emailLoginBtn = document.getElementById("email-login")
const emailRegisterBtn = document.getElementById("email-register")
const googleBtn = document.getElementById("google-login")
const phoneSendBtn = document.getElementById("phone-send")
const phoneVerifyBtn = document.getElementById("phone-verify")
const logoutBtn = document.getElementById("logout")

let confirmationResult = null
let recaptcha = null

function redirectAfterAuth() {
  location.href = "feed.html"
}

onAuthStateChanged(auth, user => {
  if (user) redirectAfterAuth()
})

async function emailLogin() {
  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()
  if (!email || !password) return
  await signInWithEmailAndPassword(auth, email, password)
}

async function emailRegister() {
  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()
  if (!email || !password) return
  await createUserWithEmailAndPassword(auth, email, password)
}

async function googleLogin() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: "select_account" })
  await signInWithPopup(auth, provider)
}

function initRecaptcha() {
  if (recaptcha) return
  recaptcha = new RecaptchaVerifier(
    "recaptcha-container",
    {
      size: "invisible"
    },
    auth
  )
}

async function sendPhoneCode() {
  const phone = phoneInput.value.trim()
  if (!phone) return
  initRecaptcha()
  confirmationResult = await signInWithPhoneNumber(
    auth,
    phone,
    recaptcha
  )
}

async function verifyPhoneCode() {
  const code = smsInput.value.trim()
  if (!code || !confirmationResult) return
  await confirmationResult.confirm(code)
}

async function logout() {
  await signOut(auth)
  location.href = "index.html"
}

if (emailLoginBtn) emailLoginBtn.onclick = emailLogin
if (emailRegisterBtn) emailRegisterBtn.onclick = emailRegister
if (googleBtn) googleBtn.onclick = googleLogin
if (phoneSendBtn) phoneSendBtn.onclick = sendPhoneCode
if (phoneVerifyBtn) phoneVerifyBtn.onclick = verifyPhoneCode
if (logoutBtn) logoutBtn.onclick = logout
