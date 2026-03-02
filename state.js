import { auth, db } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

let currentUser = null
let userCache = null
let initialized = false
let subscribers = []

function notify() {
  subscribers.forEach(fn => fn(userCache))
}

export function subscribe(fn) {
  subscribers.push(fn)
  if (userCache) fn(userCache)
  return () => {
    subscribers = subscribers.filter(f => f !== fn)
  }
}

async function createUserDocument(user) {
  const ref = doc(db, "users", user.uid)
  const base =
    user.displayName ||
    user.email?.split("@")[0] ||
    "user" + user.uid.slice(0, 5)

  const payload = {
    username: base.slice(0, 20),
    bio: "",
    xp: 0,
    level: 1,
    totalLikes: 0,
    totalComments: 0,
    followersCount: 0,
    followingCount: 0,
    role: "user",
    createdAt: serverTimestamp()
  }

  await setDoc(ref, payload)
  return payload
}

async function loadUser(user) {
  const ref = doc(db, "users", user.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const data = await createUserDocument(user)
    return { uid: user.uid, ...data }
  }

  return { uid: user.uid, ...snap.data() }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null
    userCache = null
    initialized = false
    notify()
    return
  }

  currentUser = user
  userCache = await loadUser(user)
  initialized = true
  notify()
})

export function isReady() {
  return initialized
}

export function getUser() {
  return userCache
}

export function isAdmin() {
  return userCache?.role === "admin"
}

export async function updateUsername(newName) {
  if (!userCache) throw new Error("not-ready")
  const prev = userCache.username
  userCache.username = newName
  notify()

  try {
    await updateDoc(doc(db, "users", userCache.uid), {
      username: newName
    })
  } catch (e) {
    userCache.username = prev
    notify()
    throw e
  }
}

export async function updateBio(newBio) {
  if (!userCache) throw new Error("not-ready")
  const prev = userCache.bio
  userCache.bio = newBio
  notify()

  try {
    await updateDoc(doc(db, "users", userCache.uid), {
      bio: newBio
    })
  } catch (e) {
    userCache.bio = prev
    notify()
    throw e
  }
}

export async function followUser(targetUid) {
  if (!userCache) throw new Error("not-ready")
  userCache.followingCount++
  notify()

  try {
    await setDoc(
      doc(db, "users", targetUid, "followers", userCache.uid),
      { createdAt: serverTimestamp() }
    )

    await setDoc(
      doc(db, "users", userCache.uid, "following", targetUid),
      { createdAt: serverTimestamp() }
    )

    await updateDoc(doc(db, "users", targetUid), {
      followersCount: increment(1)
    })

    await updateDoc(doc(db, "users", userCache.uid), {
      followingCount: increment(1)
    })
  } catch (e) {
    userCache.followingCount--
    notify()
    throw e
  }
}

export async function unfollowUser(targetUid) {
  if (!userCache) throw new Error("not-ready")
  userCache.followingCount--
  notify()

  try {
    await deleteDoc(
      doc(db, "users", targetUid, "followers", userCache.uid)
    )

    await deleteDoc(
      doc(db, "users", userCache.uid, "following", targetUid)
    )

    await updateDoc(doc(db, "users", targetUid), {
      followersCount: increment(-1)
    })

    await updateDoc(doc(db, "users", userCache.uid), {
      followingCount: increment(-1)
    })
  } catch (e) {
    userCache.followingCount++
    notify()
    throw e
  }
}

export async function createPost(content) {
  if (!userCache) throw new Error("not-ready")

  await addDoc(collection(db, "posts"), {
    userId: userCache.uid,
    content,
    likes: 0,
    comments: 0,
    createdAt: serverTimestamp()
  })
}

export async function likePost(postId) {
  if (!userCache) throw new Error("not-ready")

  await setDoc(
    doc(db, "posts", postId, "likes", userCache.uid),
    { createdAt: serverTimestamp() }
  )

  await updateDoc(doc(db, "posts", postId), {
    likes: increment(1)
  })

  await updateDoc(doc(db, "users", userCache.uid), {
    xp: increment(1),
    totalLikes: increment(1)
  })
}

export async function unlikePost(postId) {
  if (!userCache) throw new Error("not-ready")

  await deleteDoc(
    doc(db, "posts", postId, "likes", userCache.uid)
  )

  await updateDoc(doc(db, "posts", postId), {
    likes: increment(-1)
  })
}

export async function addComment(postId, text) {
  if (!userCache) throw new Error("not-ready")

  await addDoc(
    collection(db, "posts", postId, "comments"),
    {
      userId: userCache.uid,
      username: userCache.username,
      text,
      createdAt: serverTimestamp()
    }
  )

  await updateDoc(doc(db, "posts", postId), {
    comments: increment(1)
  })

  await updateDoc(doc(db, "users", userCache.uid), {
    xp: increment(3),
    totalComments: increment(1)
  })
}

export async function adminDeletePost(postId) {
  if (!isAdmin()) throw new Error("forbidden")
  await deleteDoc(doc(db, "posts", postId))
      }
