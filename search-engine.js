import {
  subscribe,
  isReady,
  getUser
} from "./state.js"

import { db } from "./backend.js"

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const input = document.getElementById("search-input")
const resultsRoot = document.getElementById("search-results")

let viewer = null
let currentQuery = ""
let searchUnsub = null
let lastCursor = null
let loading = false
let reachedEnd = false
let activeResults = new Map()
let suggestedUsers = []
let scrollLock = false

function clearResults() {
  resultsRoot.innerHTML = ""
  activeResults.clear()
  lastCursor = null
  reachedEnd = false
}

function createUserShell(uid) {
  const el = document.createElement("div")
  el.className = "search-result"
  el.dataset.uid = uid
  el.innerHTML = `
    <h4></h4>
    <p></p>
    <div class="meta">
      <span class="followers"></span>
      <span class="following"></span>
    </div>
  `
  return el
}

function applyUserData(el, data) {
  el.querySelector("h4").textContent = data.username
  el.querySelector("p").textContent = data.bio || "Keine Bio"
  el.querySelector(".followers").textContent = "Follower " + (data.followersCount || 0)
  el.querySelector(".following").textContent = "Folgt " + (data.followingCount || 0)
}

function attachNavigation(el, uid) {
  el.onclick = () => {
    location.href = "profile.html?uid=" + uid
  }
}

async function renderUser(uid, data) {
  let el = activeResults.get(uid)
  if (!el) {
    el = createUserShell(uid)
    activeResults.set(uid, el)
    resultsRoot.appendChild(el)
  }
  applyUserData(el, data)
  attachNavigation(el, uid)
}

async function hydrateUser(uid) {
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { uid, ...snap.data() }
}

async function renderHydrated(uid) {
  const data = await hydrateUser(uid)
  if (!data) return
  renderUser(uid, data)
}

function detachSearch() {
  if (searchUnsub) {
    searchUnsub()
    searchUnsub = null
  }
}

function attachSearchRealtime(q) {
  detachSearch()
  searchUnsub = onSnapshot(q, snap => {
    snap.docChanges().forEach(change => {
      const uid = change.doc.id
      if (change.type === "removed") {
        const el = activeResults.get(uid)
        if (el) el.remove()
        activeResults.delete(uid)
      } else {
        renderUser(uid, change.doc.data())
      }
    })
  })
}

async function performSearch(value, realtime = false) {
  if (loading || reachedEnd) return
  loading = true

  const q = query(
    collection(db, "users"),
    where("username", ">=", value),
    where("username", "<=", value + "\uf8ff"),
    orderBy("username"),
    limit(20),
    ...(lastCursor ? [startAfter(lastCursor)] : [])
  )

  const snap = await getDocs(q)

  if (snap.empty) {
    reachedEnd = true
    loading = false
    return
  }

  lastCursor = snap.docs[snap.docs.length - 1]

  snap.forEach(d => {
    renderUser(d.id, d.data())
  })

  if (realtime && !searchUnsub) {
    attachSearchRealtime(q)
  }

  loading = false
}

async function loadSuggestions() {
  clearResults()
  loading = true

  const q = query(
    collection(db, "users"),
    orderBy("followersCount", "desc"),
    limit(20)
  )

  const snap = await getDocs(q)

  snap.forEach(d => {
    renderUser(d.id, d.data())
  })

  loading = false
}

function handleInput() {
  const value = input.value.trim().toLowerCase()

  if (value === currentQuery) return

  currentQuery = value
  detachSearch()
  clearResults()

  if (value.length < 2) {
    loadSuggestions()
    return
  }

  performSearch(value, true)
}

function handleScroll() {
  if (scrollLock || reachedEnd) return
  const nearBottom =
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 200

  if (!nearBottom) return

  scrollLock = true
  performSearch(currentQuery).finally(() => {
    scrollLock = false
  })
}

function bootstrap(user) {
  viewer = user
  input.value = ""
  currentQuery = ""
  clearResults()
  loadSuggestions()
}

input.addEventListener("input", handleInput)
window.addEventListener("scroll", handleScroll)

subscribe(user => {
  if (!user || !isReady()) return
  detachSearch()
  bootstrap(user)
})
