const form = document.getElementById("auth-form")
const usernameInput = document.getElementById("username")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const errorBox = document.getElementById("auth-error")
const googleButton = document.getElementById("google-login")

function setUser(user) {
  localStorage.setItem("obscura_user", JSON.stringify(user))
}

function getUser() {
  const user = localStorage.getItem("obscura_user")
  return user ? JSON.parse(user) : null
}

function redirectToFeed() {
  window.location.href = "feed.html"
}

function validateInput() {
  if (!emailInput.value || !passwordInput.value) {
    errorBox.textContent = "Bitte E-Mail und Passwort eingeben"
    return false
  }
  return true
}

if (getUser()) {
  redirectToFeed()
}

form.addEventListener("submit", (e) => {
  e.preventDefault()
  errorBox.textContent = ""

  if (!validateInput()) return

  const user = {
    id: crypto.randomUUID(),
    username: usernameInput.value || "user",
    email: emailInput.value,
    xp: 0,
    createdAt: Date.now()
  }

  setUser(user)
  redirectToFeed()
})

googleButton.addEventListener("click", () => {
  const user = {
    id: crypto.randomUUID(),
    username: "google_user",
    email: "google@user",
    xp: 0,
    createdAt: Date.now()
  }

  setUser(user)
  redirectToFeed()
})
