"use client";

import React, { useState, useEffect, use } from 'react';
import { toast } from "sonner";
import { Download, Share2, ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, ShoppingCart, Send } from "lucide-react";
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function RecipeDetailsPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [addingToGrocery, setAddingToGrocery] = useState(false);

    // Interactions state
    const [user, setUser] = useState(null);
    const [likes, setLikes] = useState([]);
    const [dislikes, setDislikes] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [postingComment, setPostingComment] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser || null);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const fetchRecipeAndInteractions = async () => {
            try {
                // Fetch recipe details
                const res = await fetch(`/api/recipes/${id}`);
                if (!res.ok) throw new Error("Recipe not found");
                const data = await res.json();
                setRecipe(data.recipe);

                // Fetch interactions
                const interactRes = await fetch(`/api/recipes/${id}/interact`);
                if (interactRes.ok) {
                    const interactData = await interactRes.json();
                    setLikes(interactData.likes || []);
                    setDislikes(interactData.dislikes || []);
                    setComments(interactData.comments || []);
                }
            } catch (err) {
                toast.error("Failed to load recipe details.");
            } finally {
                setLoading(false);
            }
        };
        fetchRecipeAndInteractions();
    }, [id]);

    const handleInteraction = async (action) => {
        if (!user) {
            toast.error("Please log in to interact.");
            return;
        }
        
        // Optimistic update for likes/dislikes
        if (action === 'like' || action === 'dislike') {
            setLikes(prev => action === 'like' ? [...prev, user.uid] : prev.filter(uid => uid !== user.uid));
            setDislikes(prev => action === 'dislike' ? [...prev, user.uid] : prev.filter(uid => uid !== user.uid));
        }

        try {
            const res = await fetch(`/api/recipes/${id}/interact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    firebaseUID: user.uid,
                    user: user.displayName || "Anonymous",
                    email: user.email || "",
                    avatar: user.photoURL || "",
                    content: newComment,
                    recipeTitle: recipe?.title
                })
            });

            if (!res.ok) throw new Error("Failed to process interaction");

            const data = await res.json();
            if (action === 'like' || action === 'dislike') {
                setLikes(data.likes);
                setDislikes(data.dislikes);
            } else if (action === 'comment') {
                setComments([data.comment, ...comments]);
                setNewComment("");
                toast.success("Comment added!");
            }
        } catch (err) {
            toast.error("Action failed. Please try again.");
            // Re-fetch to fix optimistic state if failed (could be implemented)
        } finally {
            if (action === 'comment') setPostingComment(false);
        }
    };

    const submitComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setPostingComment(true);
        handleInteraction('comment');
    };

    const handleAddToGrocery = async () => {
        if (!user) {
            toast.error("Please log in to add to grocery list.");
            return;
        }
        setAddingToGrocery(true);
        try {
            const items = recipe.ingredients.map(ing => ({ name: ing, qty: '1', checked: false }));
            const res = await fetch('/api/grocery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebaseUID: user.uid, userId: user.email, items })
            });
            if (!res.ok) throw new Error("Failed to add to grocery list");
            toast.success("Ingredients added to Grocery List!");
        } catch (err) {
            toast.error("Failed to add ingredients.");
        } finally {
            setAddingToGrocery(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!recipe) return;
        setDownloadingPdf(true);
        toast.loading("Generating PDF...", { id: 'pdf-toast' });
        try {
            const { default: jsPDF } = await import("jspdf");
            const { default: html2canvas } = await import("html2canvas");
            const element = document.getElementById("pdf-content-area");
            if (!element) throw new Error("Content area not found");

            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${recipe.title}.pdf`);
            toast.success("PDF Downloaded!", { id: 'pdf-toast' });
        } catch (err) {
            console.error("PDF Export failed:", err);
            toast.error("Failed to generate PDF.", { id: 'pdf-toast' });
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try { await navigator.share({ title: recipe.title, text: `Check out: ${recipe.title}`, url }); }
            catch { }
        } else {
            navigator.clipboard.writeText(url);
            toast.success("Link copied!");
        }
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "1.2rem" }}>
            Loading recipe...
        </div>
    );
    if (!recipe) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "1.2rem" }}>
            Recipe not found.
        </div>
    );

    const btnStyle = (bg, color = "white", active = false) => ({
        display: "flex", alignItems: "center", gap: "8px",
        padding: "10px 22px", background: active ? "var(--primary-color)" : bg, color: active ? "white" : color,
        border: bg === "var(--bg-card)" && !active ? "1px solid var(--border)" : "none",
        borderRadius: "30px", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem",
        transition: "all 0.2s",
    });

    const isLiked = user && likes.includes(user.uid);
    const isDisliked = user && dislikes.includes(user.uid);

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px", minHeight: "100vh" }}>
            {/* Toolbar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }} data-html2canvas-ignore="true">
                <button onClick={() => router.back()} style={btnStyle("var(--bg-card)", "var(--text-main)")}>
                    <ArrowLeft size={18} /> Back
                </button>
                <div style={{ flex: 1 }} />
                <button onClick={() => handleInteraction('like')} style={btnStyle("var(--bg-card)", "var(--text-main)", isLiked)}>
                    <ThumbsUp size={18} /> {likes.length}
                </button>
                <button onClick={() => handleInteraction('dislike')} style={btnStyle("var(--bg-card)", "var(--text-main)", isDisliked)}>
                    <ThumbsDown size={18} /> {dislikes.length}
                </button>
                <button onClick={handleAddToGrocery} disabled={addingToGrocery} style={btnStyle("var(--primary-color)")}>
                    <ShoppingCart size={18} /> {addingToGrocery ? "Adding..." : "Grocery List"}
                </button>
                <button onClick={handleDownloadPdf} disabled={downloadingPdf} style={btnStyle("var(--bg-card)", "var(--text-main)")}>
                    <Download size={18} />
                </button>
                <button onClick={handleShare} style={btnStyle("var(--bg-card)", "var(--text-main)")}>
                    <Share2 size={18} />
                </button>
            </div>

            {/* PDF Content */}
            <div id="pdf-content-area" className="mobile-p-20" style={{
                background: "var(--bg-card)", padding: "40px",
                borderRadius: "var(--radius-xl)", border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)", marginBottom: "40px"
            }}>
                <div className="flex-col-mobile" style={{ display: "flex", gap: "40px", marginBottom: "40px", flexWrap: "wrap" }}>
                    <img
                        src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"}
                        alt={recipe.title} crossOrigin="anonymous"
                        className="recipe-img-mobile"
                        style={{ width: "320px", height: "320px", objectFit: "cover", borderRadius: "var(--radius-xl)", flexShrink: 0 }}
                        onError={e => e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"}
                    />
                    <div style={{ flex: 1, minWidth: "250px" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--primary-color)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {[recipe.area, recipe.category].filter(Boolean).join(" · ")}
                        </span>
                        <h1 style={{ fontSize: "2.6rem", fontWeight: "900", margin: "10px 0 20px", lineHeight: "1.15", letterSpacing: "-0.03em" }}>
                            {recipe.title}
                        </h1>
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
                            {[["🔥", `${recipe.calories} kcal`], ["⏱", "30 mins"], ["🍽", recipe.category || "Meal"]].map(([icon, val]) => (
                                <div key={val} style={{ background: "var(--bg-hover)", padding: "14px 20px", borderRadius: "var(--radius-md)", textAlign: "center", flex: "1 1 100px" }}>
                                    <span style={{ display: "block", fontSize: "1.1rem" }}>{icon}</span>
                                    <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)" }}>{val}</span>
                                </div>
                            ))}
                        </div>
                        {recipe.tags?.length > 0 && (
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {recipe.tags.map(t => (
                                    <span key={t} style={{ background: "var(--bg-hover)", color: "var(--text-muted)", padding: "5px 14px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "700" }}>
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "40px" }}>
                    <div>
                        <h2 style={{ fontSize: "1.6rem", fontWeight: "800", borderBottom: "2px solid var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>Ingredients</h2>
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                            {recipe.ingredients.map((ing, i) => (
                                <li key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--bg-hover)", fontSize: "1rem", color: "var(--text-main)", display: "flex", gap: "10px" }}>
                                    <span style={{ color: "var(--primary-color)", fontWeight: "800" }}>•</span> {ing}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 style={{ fontSize: "1.6rem", fontWeight: "800", borderBottom: "2px solid var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>Instructions</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {recipe.instructions.map((step, i) => (
                                <div key={i} style={{ display: "flex", gap: "14px" }}>
                                    <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary-color)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "0.85rem", flexShrink: 0, marginTop: "2px" }}>
                                        {i + 1}
                                    </span>
                                    <p style={{ fontSize: "1rem", lineHeight: "1.8", color: "var(--text-main)", margin: 0 }}>{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div data-html2canvas-ignore="true" style={{
                background: "var(--bg-card)", padding: "40px",
                borderRadius: "var(--radius-xl)", border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)"
            }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: "800", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <MessageSquare size={24} /> Comments ({comments.length})
                </h2>

                {user ? (
                    <form onSubmit={submitComment} style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
                        <div style={{
                            width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary-color)",
                            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: "bold", flexShrink: 0, overflow: "hidden"
                        }}>
                            {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.displayName?.[0]?.toUpperCase() || "?")}
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                            <textarea
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Leave a review or tip for this recipe..."
                                rows={2}
                                style={{
                                    width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border)",
                                    background: "var(--bg-main)", color: "var(--text-main)", fontSize: "1rem", resize: "vertical",
                                    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                                }}
                            />
                            <button
                                type="submit"
                                disabled={postingComment || !newComment.trim()}
                                style={{
                                    alignSelf: "flex-end", display: "flex", alignItems: "center", gap: "6px",
                                    padding: "8px 20px", background: "var(--primary-color)", color: "white",
                                    border: "none", borderRadius: "20px", fontWeight: "700", cursor: "pointer",
                                    opacity: (postingComment || !newComment.trim()) ? 0.6 : 1, transition: "opacity 0.2s",
                                }}
                            >
                                <Send size={16} /> Post
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={{ padding: "20px", background: "var(--bg-hover)", borderRadius: "12px", textAlign: "center", marginBottom: "32px", color: "var(--text-muted)" }}>
                        Please <a href="/login" style={{ color: "var(--primary-color)", fontWeight: "bold" }}>log in</a> to leave a comment.
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {comments.map((comment, idx) => (
                        <div key={comment._id || idx} style={{ display: "flex", gap: "12px" }}>
                            <div style={{
                                width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-hover)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: "bold", flexShrink: 0, overflow: "hidden", color: "var(--text-muted)"
                            }}>
                                {comment.avatar ? <img src={comment.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (comment.user?.[0]?.toUpperCase() || "?")}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <strong style={{ fontSize: "0.95rem" }}>{comment.user}</strong>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ margin: 0, color: "var(--text-main)", lineHeight: "1.6" }}>{comment.content}</p>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 0" }}>
                            No comments yet. Be the first to share your thoughts!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

