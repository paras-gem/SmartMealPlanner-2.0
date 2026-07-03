"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { Pencil, Trash2, Send } from "lucide-react";

const TAGS = ["General", "Tips & Tricks", "Recipe Request", "Health", "Meal Prep", "Showcase"];

export default function CommunityPage() {
  const [user, setUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("General");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Listen to Firebase auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsub();
  }, []);

  // Fetch all threads
  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community");
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  // Post new comment
  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return toast.error("Write something first.");
    setPosting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: user?.displayName || "Anonymous",
          email: user?.email || "",
          avatar: user?.photoURL || "",
          content,
          tag,
        }),
      });
      if (!res.ok) throw new Error("Failed to post");
      const newThread = await res.json();
      setThreads(prev => [newThread, ...prev]);
      setContent("");
      toast.success("Comment posted!");
    } catch {
      toast.error("Failed to post. Try again.");
    } finally {
      setPosting(false);
    }
  };

  // Save edit
  const handleEditSave = async (id) => {
    if (!editContent.trim()) return toast.error("Content cannot be empty.");
    try {
      const res = await fetch(`/api/community/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, email: user?.email }),
      });
      if (!res.ok) throw new Error("Unauthorized");
      const updated = await res.json();
      setThreads(prev => prev.map(t => t._id === id ? { ...t, content: updated.content } : t));
      setEditId(null);
      toast.success("Comment updated!");
    } catch {
      toast.error("Could not update. You can only edit your own comments.");
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/community/${id}?email=${encodeURIComponent(user?.email || "")}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Unauthorized");
      setThreads(prev => prev.filter(t => t._id !== id));
      toast.success("Comment deleted.");
    } catch {
      toast.error("Could not delete. You can only delete your own comments.");
    }
  };

  const isOwner = (thread) => user && user.email === thread.email;

  const tagColors = {
    "General": "#6366f1",
    "Tips & Tricks": "#f59e0b",
    "Recipe Request": "#10b981",
    "Health": "#ef4444",
    "Meal Prep": "#3b82f6",
    "Showcase": "#ec4899",
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.8rem", fontWeight: "800", letterSpacing: "-0.04em", marginBottom: "10px" }}>
          Community 💬
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Share recipes, tips, and meal ideas with fellow food lovers.
        </p>
      </div>

      {/* Post Box */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "30px",
        marginBottom: "40px",
        boxShadow: "var(--shadow)",
      }}>
        <div style={{ display: "flex", gap: "14px", marginBottom: "16px", alignItems: "flex-start" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
            background: "var(--primary-color)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", fontWeight: "800", color: "white", fontSize: "1rem",
          }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (user?.displayName?.[0]?.toUpperCase() || "?")}
          </div>
          <form onSubmit={handlePost} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={user ? "Share a tip, recipe, or thought..." : "Log in to share your thoughts..."}
              disabled={!user}
              rows={3}
              style={{
                width: "100%", padding: "14px 16px",
                borderRadius: "12px", border: "1px solid var(--border)",
                background: "var(--bg-main)", color: "var(--text-main)",
                fontSize: "1rem", resize: "vertical", outline: "none",
                transition: "border-color 0.2s", fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <select
                value={tag}
                onChange={e => setTag(e.target.value)}
                disabled={!user}
                style={{
                  padding: "8px 14px", borderRadius: "30px",
                  border: "1px solid var(--border)", background: "var(--bg-hover)",
                  color: "var(--text-main)", fontWeight: "600", fontSize: "0.85rem",
                  cursor: "pointer", outline: "none",
                }}
              >
                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button
                type="submit"
                disabled={!user || posting}
                style={{
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 24px", background: "var(--primary-color)", color: "white",
                  border: "none", borderRadius: "30px", fontWeight: "700", fontSize: "0.95rem",
                  cursor: user ? "pointer" : "not-allowed", opacity: (!user || posting) ? 0.6 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                <Send size={16} />
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
            {!user && (
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                <a href="/login" style={{ color: "var(--primary-color)", fontWeight: "700" }}>Log in</a> to participate in the community.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Threads */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: "120px", background: "var(--bg-hover)", borderRadius: "var(--radius-xl)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🥗</div>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>No discussions yet</h3>
          <p>Be the first to start a conversation!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {threads.map(thread => (
            <div key={thread._id} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "24px",
              boxShadow: "var(--shadow)",
              transition: "box-shadow 0.2s",
            }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                {/* Avatar */}
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
                  background: "var(--bg-hover)", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "800", fontSize: "1rem", color: "var(--text-muted)",
                }}>
                  {thread.avatar
                    ? <img src={thread.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (thread.user?.[0]?.toUpperCase() || "?")}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <strong style={{ fontWeight: "700", fontSize: "1rem" }}>{thread.user}</strong>
                    <span style={{
                      fontSize: "0.75rem", fontWeight: "800", padding: "3px 10px",
                      borderRadius: "20px", color: "white",
                      background: tagColors[thread.tag] || "#6366f1",
                    }}>
                      {thread.tag}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                      {new Date(thread.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  {editId === thread._id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        rows={3}
                        style={{
                          width: "100%", padding: "12px", borderRadius: "10px",
                          border: "1px solid var(--border)", background: "var(--bg-main)",
                          color: "var(--text-main)", fontSize: "1rem", resize: "vertical",
                          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => handleEditSave(thread._id)} style={{ padding: "8px 20px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "20px", fontWeight: "700", cursor: "pointer", fontSize: "0.9rem" }}>
                          Save
                        </button>
                        <button onClick={() => setEditId(null)} style={{ padding: "8px 20px", background: "var(--bg-hover)", color: "var(--text-main)", border: "1px solid var(--border)", borderRadius: "20px", fontWeight: "700", cursor: "pointer", fontSize: "0.9rem" }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: "1rem", lineHeight: "1.7", color: "var(--text-main)", wordBreak: "break-word" }}>
                      {thread.content}
                    </p>
                  )}

                  {/* Actions */}
                  {isOwner(thread) && editId !== thread._id && (
                    <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
                      <button onClick={() => { setEditId(thread._id); setEditContent(thread.content); }} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", transition: "all 0.2s" }}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(thread._id)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", transition: "all 0.2s" }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
