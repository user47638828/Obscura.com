import { auth, db, ensureUserDocument } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const params = new URLSearchParams(location.search)
const profileUidParam = params.get("uid")

const usernameEl = document.getElementById("profile-username")
const bioEl = document.getElementById("profile-bio")
const levelEl = document.getElementById("profile-level")
const xpEl = document.getElementById("profile-xp")
const likesEl = document.getElementById("profile-likes")
const commentsEl = document.getElementById("profile-comments")
const followersEl = document.getElementById("profile-followers")
const followingEl = document.getElementById("profile-following")

const editNameBtn = document.getElementById("edit-name")
const editBioBtn = document.getElementById("edit-bio")
const followBtn = document.getElementById("follow-btn")

const createPostSection = document.getElementById("create-post")
const postInput = document.getElementById("post-input")
const postBtn = document.getElementById("post-btn")
const postsEl = document.getElementById("posts")

function levelFromXp(xp) {
  return Math.floor(xp / 50) + 1
}

async function loadProfile(viewer, profileUid) {
  const userRef = doc(db, "users", profileUid)
  const snap = await getDoc(userRef)
  const data = snap.data()

  usernameEl.textContent = data.username
  bioEl.textContent = data.bio || "Keine Bio"
  xpEl.textContent = data.xp
  levelEl.textContent = levelFromXp(data.xp)
  likesEl.textContent = data.totalLikes || 0
  commentsEl.textContent = data.totalComments || 0

  const followersSnap = await getDocs(collection(db, "users", profileUid, "followers"))
  const followingSnap = await getDocs(collection(db, "users", profileUid, "following"))
  followersEl.textContent = followersSnap.size
  followingEl.textContent = followingSnap.size

  const postsSnap = await getDocs(
    query(collection(db, "posts"), where("userId", "==", profileUid))
  )
  postsEl.innerHTML = ""
  postsSnap.forEach(d => {
    const el = document.createElement("div")
    el.className = "profile-post"
    el.textContent = d.data().content
    postsEl.appendChild(el)
  })

  const isOwnProfile = viewer.uid === profileUid

  editNameBtn.style.display = isOwnProfile ? "inline-block" : "none"
  editBioBtn.style.display = isOwnProfile ? "inline-block" : "none"
  createPostSection.style.display = isOwnProfile ? "block" : "none"
  followBtn.style.display = isOwnProfile ? "none" : "block"

  if (!isOwnProfile) {
    const followRef = doc(db, "users", profileUid, "followers", viewer.uid)
    const followingRef = doc(db, "users", viewer.uid, "following", profileUid)
    const isFollowing = (await getDoc(followRef)).exists()
    followBtn.textContent = isFollowing ? "Unfollow" : "Follow"

    followBtn.onclick = async () => {
      if ((await getDoc(followRef)).exists()) {
        await deleteDoc(followRef)
        await deleteDoc(followingRef)
      } else {
        await setDoc(followRef, { createdAt: serverTimestamp() })
        await setDoc(followingRef, { createdAt: serverTimestamp() })
      }
      loadProfile(viewer, profileUid)
    }
  }

  editNameBtn.onclick = async () => {
    const name = prompt("Neuer Username", data.username)
    if (!name) return
    await updateDoc(userRef, { username: name })
    loadProfile(viewer, profileUid)
  }

  editBioBtn.onclick = async () => {
    const bio = prompt("Neue Bio", data.bio || "")
    if (bio === null) return
    await updateDoc(userRef, { bio })
    loadProfile(viewer, profileUid)
  }

  postBtn.onclick = async () => {
    const text = postInput.value.trim()
    if (!text) return

    await addDoc(collection(db, "posts"), {
      userId: viewer.uid,
      username: data.username,
      content: text,
      likes: 0,
      comments: 0,
      createdAt: serverTimestamp()
    })

    postInput.value = ""
    loadProfile(viewer, profileUid)
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "index.html"
    return
  }

  await ensureUserDocument(user)

  const profileUid = profileUidParam || user.uid
  await loadProfile(user, profileUid)
})
