import { auth, db, ensureUserDocument } from "./backend.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js"
import {
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const feedEl = document.getElementById("feed-posts")

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html"
    return
  }

  await ensureUserDocument(user)

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  )

  const snap = await getDocs(q)

  snap.forEach((doc) => {
    const post = doc.data()

    const el = document.createElement("div")
    el.className = "feed-post"
    el.innerHTML = `
      <div class="feed-post-header">${post.username}</div>
      <div class="feed-post-content">${post.content}</div>
      <div class="feed-post-meta">
        <span>❤️ ${post.likes}</span>
        <span>💬 ${post.comments}</span>
      </div>
    `
    feedEl.appendChild(el)
  })
})
