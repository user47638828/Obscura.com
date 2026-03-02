import {
  subscribe,
  isReady,
  getUser,
  likePost,
  unlikePost,
  addComment
} from "./state.js"

import { db } from "./backend.js"
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"

const feedRoot = document.getElementById("feed-posts")
const modal = document.getElementById("comments-modal")
const commentsList = document.getElementById("comments-list")
const commentInput = document.getElementById("comment-input")
const sendCommentBtn = document.getElementById("send-comment")

let viewer = null
let feedUnsub = null
let activePostId = null
let localLikeState = new Map()
let localLikeCount = new Map()
let localCommentCount = new Map()

function clearFeed() {
  feedRoot.innerHTML = ""
  localLikeState.clear()
  localLikeCount.clear()
  localCommentCount.clear()
}

function timeAgo(ts) {
  if (!ts) return "gerade eben"
  const diff = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (diff < 60) return diff + "s"
  if (diff < 3600) return Math.floor(diff / 60) + "m"
  if (diff < 86400) return Math.floor(diff / 3600) + "h"
  return Math.floor(diff / 86400) + "d"
}

function createPostShell(id) {
  const el = document.createElement("div")
  el.className = "feed-post"
  el.dataset.id = id
  el.innerHTML = `
    <div class="feed-post-time"></div>
    <div class="feed-post-header"></div>
    <div class="feed-post-content"></div>
    <div class="feed-post-meta">
      <span class="like"><span class="heart">🩶</span> <span class="count">0</span></span>
      <span class="comment">💬 0</span>
    </div>
  `
  return el
}

function applyPostData(el, post) {
  el.querySelector(".feed-post-time").textContent = timeAgo(post.createdAt)
  el.querySelector(".feed-post-header").textContent = post.username || "user"
  el.querySelector(".feed-post-content").textContent = post.content
}

function applyLikeState(el, postId) {
  const liked = localLikeState.get(postId)
  const heart = el.querySelector(".heart")
  const count = el.querySelector(".count")
  heart.textContent = liked ? "❤️" : "🩶"
  count.textContent = localLikeCount.get(postId) || 0
}

function applyCommentCount(el, postId) {
  const span = el.querySelector(".comment")
  span.textContent = "💬 " + (localCommentCount.get(postId) || 0)
}

async function hydrateLikeState(postId) {
  const ref = doc(db, "posts", postId, "likes", viewer.uid)
  const snap = await getDoc(ref)
  localLikeState.set(postId, snap.exists())
}

async function hydrateCounts(postId, data) {
  localLikeCount.set(postId, data.likes || 0)
  localCommentCount.set(postId, data.comments || 0)
}

async function attachLikeHandler(el, postId) {
  const likeEl = el.querySelector(".like")
  likeEl.onclick = async () => {
    const liked = localLikeState.get(postId)
    if (liked) {
      localLikeState.set(postId, false)
      localLikeCount.set(postId, localLikeCount.get(postId) - 1)
      applyLikeState(el, postId)
      try {
        await unlikePost(postId)
      } catch {
        localLikeState.set(postId, true)
        localLikeCount.set(postId, localLikeCount.get(postId) + 1)
        applyLikeState(el, postId)
      }
    } else {
      localLikeState.set(postId, true)
      localLikeCount.set(postId, localLikeCount.get(postId) + 1)
      applyLikeState(el, postId)
      try {
        await likePost(postId)
      } catch {
        localLikeState.set(postId, false)
        localLikeCount.set(postId, localLikeCount.get(postId) - 1)
        applyLikeState(el, postId)
      }
    }
  }
}

function attachCommentHandler(el, postId) {
  const c = el.querySelector(".comment")
  c.onclick = () => openComments(postId)
}

function renderPost(postId, data) {
  let el = feedRoot.querySelector(`[data-id="${postId}"]`)
  if (!el) {
    el = createPostShell(postId)
    feedRoot.appendChild(el)
  }
  applyPostData(el, data)
  hydrateCounts(postId, data).then(() => {
    applyLikeState(el, postId)
    applyCommentCount(el, postId)
  })
  hydrateLikeState(postId).then(() => applyLikeState(el, postId))
  attachLikeHandler(el, postId)
  attachCommentHandler(el, postId)
}

function subscribeFeed() {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(50)
  )

  feedUnsub = onSnapshot(q, snap => {
    snap.docChanges().forEach(change => {
      if (change.type === "added" || change.type === "modified") {
        renderPost(change.doc.id, change.doc.data())
      }
      if (change.type === "removed") {
        const el = feedRoot.querySelector(`[data-id="${change.doc.id}"]`)
        if (el) el.remove()
      }
    })
  })
}

function closeModal() {
  modal.classList.add("hidden")
  commentsList.innerHTML = ""
  commentInput.value = ""
  activePostId = null
}

modal.onclick = e => {
  if (e.target === modal) closeModal()
}

async function openComments(postId) {
  activePostId = postId
  commentsList.innerHTML = ""
  modal.classList.remove("hidden")

  const snap = await getDocs(
    query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    )
  )

  snap.forEach(d => {
    const data = d.data()
    const el = document.createElement("div")
    el.className = "comment"
    el.innerHTML = `
      <small>${data.username}</small>
      <div>${data.text}</div>
    `
    commentsList.appendChild(el)
  })
}

sendCommentBtn.onclick = async () => {
  const text = commentInput.value.trim()
  if (!text || !activePostId) return

  const optimistic = document.createElement("div")
  optimistic.className = "comment"
  optimistic.innerHTML = `
    <small>${viewer.username}</small>
    <div>${text}</div>
  `
  commentsList.appendChild(optimistic)
  commentInput.value = ""

  localCommentCount.set(
    activePostId,
    (localCommentCount.get(activePostId) || 0) + 1
  )

  const postEl = feedRoot.querySelector(`[data-id="${activePostId}"]`)
  if (postEl) applyCommentCount(postEl, activePostId)

  try {
    await addComment(activePostId, text)
  } catch {
    optimistic.remove()
    localCommentCount.set(
      activePostId,
      localCommentCount.get(activePostId) - 1
    )
    if (postEl) applyCommentCount(postEl, activePostId)
  }
}

function cleanup() {
  if (feedUnsub) feedUnsub()
  clearFeed()
}

subscribe(user => {
  if (!user || !isReady()) return
  viewer = user
  cleanup()
  subscribeFeed()
})
