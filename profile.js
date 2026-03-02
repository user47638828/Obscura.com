import {
  subscribe,
  isReady,
  getUser,
  updateUsername,
  updateBio,
  followUser,
  unfollowUser,
  createPost
} from "./state.js"

import { db } from "./backend.js"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const params = new URLSearchParams(location.search)
const profileUid = params.get("uid")

const elUsername = document.getElementById("profile-username")
const elBio = document.getElementById("profile-bio")
const elLevel = document.getElementById("profile-level")
const elXp = document.getElementById("profile-xp")
const elLikes = document.getElementById("profile-likes")
const elComments = document.getElementById("profile-comments")
const elFollowers = document.getElementById("profile-followers")
const elFollowing = document.getElementById("profile-following")

const btnEditName = document.getElementById("edit-name")
const btnEditBio = document.getElementById("edit-bio")
const btnFollow = document.getElementById("follow-btn")

const sectionCreatePost = document.getElementById("create-post")
const inputPost = document.getElementById("post-input")
const btnPost = document.getElementById("post-btn")

const postsContainer = document.getElementById("posts")

let viewer = null
let profile = null
let isOwnProfile = false
let isFollowing = false
let unsubProfile = null
let unsubPosts = null

function calcLevel(xp) {
  return Math.floor(xp / 50) + 1
}

function resetUI() {
  elUsername.textContent = ""
  elBio.textContent = ""
  elLevel.textContent = ""
  elXp.textContent = ""
  elLikes.textContent = ""
  elComments.textContent = ""
  elFollowers.textContent = ""
  elFollowing.textContent = ""
  postsContainer.innerHTML = ""
}

function applyProfile(data) {
  elUsername.textContent = data.username
  elBio.textContent = data.bio || "Keine Bio"
  elXp.textContent = data.xp
  elLevel.textContent = calcLevel(data.xp)
  elLikes.textContent = data.totalLikes || 0
  elComments.textContent = data.totalComments || 0
  elFollowers.textContent = data.followersCount || 0
  elFollowing.textContent = data.followingCount || 0
}

function setOwnProfileUI() {
  btnEditName.style.display = "inline-block"
  btnEditBio.style.display = "inline-block"
  btnFollow.style.display = "none"
  sectionCreatePost.style.display = "block"
}

function setForeignProfileUI() {
  btnEditName.style.display = "none"
  btnEditBio.style.display = "none"
  btnFollow.style.display = "block"
  sectionCreatePost.style.display = "none"
}

async function loadProfileDoc(uid) {
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("profile-not-found")
  return { uid, ...snap.data() }
}

async function checkFollowing(viewerUid, targetUid) {
  const ref = doc(db, "users", targetUid, "followers", viewerUid)
  const snap = await getDoc(ref)
  return snap.exists()
}

function renderFollowButton() {
  btnFollow.textContent = isFollowing ? "Unfollow" : "Follow"
}

async function handleFollowClick() {
  btnFollow.disabled = true
  try {
    if (isFollowing) {
      await unfollowUser(profile.uid)
      isFollowing = false
    } else {
      await followUser(profile.uid)
      isFollowing = true
    }
    renderFollowButton()
  } finally {
    btnFollow.disabled = false
  }
}

async function handleEditName() {
  const current = profile.username
  const next = prompt("Neuer Name", current)
  if (!next || next === current) return
  btnEditName.disabled = true
  try {
    await updateUsername(next)
  } finally {
    btnEditName.disabled = false
  }
}

async function handleEditBio() {
  const current = profile.bio || ""
  const next = prompt("Neue Bio", current)
  if (next === null || next === current) return
  btnEditBio.disabled = true
  try {
    await updateBio(next)
  } finally {
    btnEditBio.disabled = false
  }
}

async function handleCreatePost() {
  const text = inputPost.value.trim()
  if (!text) return
  btnPost.disabled = true
  try {
    await createPost(text)
    inputPost.value = ""
  } finally {
    btnPost.disabled = false
  }
}

function renderPost(docSnap) {
  const data = docSnap.data()
  const el = document.createElement("div")
  el.className = "profile-post"
  el.textContent = data.content
  return el
}

function subscribePosts(uid) {
  const q = query(
    collection(db, "posts"),
    where("userId", "==", uid)
  )

  unsubPosts = onSnapshot(q, snap => {
    postsContainer.innerHTML = ""
    snap.docs
      .sort((a, b) => (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0))
      .forEach(d => {
        postsContainer.appendChild(renderPost(d))
      })
  })
}

function subscribeProfile(uid) {
  const ref = doc(db, "users", uid)
  unsubProfile = onSnapshot(ref, snap => {
    if (!snap.exists()) return
    profile = { uid, ...snap.data() }
    applyProfile(profile)
  })
}

function cleanup() {
  if (unsubProfile) unsubProfile()
  if (unsubPosts) unsubPosts()
}

function bootstrap(viewerUser) {
  viewer = viewerUser
  const targetUid = profileUid || viewer.uid
  isOwnProfile = targetUid === viewer.uid

  resetUI()

  loadProfileDoc(targetUid).then(async data => {
    profile = data
    applyProfile(profile)

    if (isOwnProfile) {
      setOwnProfileUI()
    } else {
      setForeignProfileUI()
      isFollowing = await checkFollowing(viewer.uid, targetUid)
      renderFollowButton()
    }

    subscribeProfile(targetUid)
    subscribePosts(targetUid)
  })
}

btnEditName.onclick = handleEditName
btnEditBio.onclick = handleEditBio
btnFollow.onclick = handleFollowClick
btnPost.onclick = handleCreatePost

subscribe(user => {
  if (!user || !isReady()) return
  cleanup()
  bootstrap(user)
})
