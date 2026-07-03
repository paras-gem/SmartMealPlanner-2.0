"use client"
import React, { useState, useEffect } from 'react';
import '@/styles/RecipeDetails.css';
import Header from './Header.js'; // Adjust this import path if needed
import { toast } from "sonner";
import { Download, Share2, ShoppingCart, ArrowLeft } from "lucide-react";

const RecipeDetails = ({ 
    user, 
    recipe, 
    onBack, 
    onLogoClick, 
    onAboutClick, 
    onContactClick, 
    onSubscriptionClick, 
    onCommunityClick, 
    isDark, 
    toggleDarkMode, 
    onLoginClick, 
    isAIEnabled, 
    toggleAI 
}) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [localRatings, setLocalRatings] = useState(recipe?.ratings || []);
    const [submitting, setSubmitting] = useState(false);
    const [orderingGroceries, setOrderingGroceries] = useState(false);
    const [groceriesOrdered, setGroceriesOrdered] = useState(false);

    const [family, setFamily] = useState(null);
    const [personalGrocery, setPersonalGrocery] = useState({ items: [] });

    // Safely extract health conditions from your user profile object structure
    const isDiabetic = user?.goal === "Diabetic" || user?.profile?.goal === "Diabetic";
    const isHypertensive = user?.goal === "Hypertension" || user?.profile?.goal === "Hypertension";

    useEffect(() => {
        window.scrollTo(0, 0);
        const loadContextData = async () => {
            if (!user) return;
            const uid = user.firebaseUID || user.email;
            try {
                // Load personal grocery list
                const gRes = await fetch(`/api/grocery/${uid}`);
                if (gRes.ok) setPersonalGrocery(await gRes.json());

                // Load family group connection profiles
                const fRes = await fetch(`/api/family/user/${uid}`);
                if (fRes.ok) setFamily(await fRes.json());
            } catch (err) { 
                console.error("Sync data load error:", err); 
            }
        };
        loadContextData();
    }, [user, recipe]);

    const handleInstacartOrder = async () => {
        if (!user) return toast.error("Please log in to add items to your cart.");
        setOrderingGroceries(true);
        
        try {
            const uid = user.firebaseUID || user.email;
            const newItems = (recipe.ingredients || []).map(ing => ({
                name: typeof ing === 'string' ? ing : `${ing.qty} ${ing.unit} ${ing.name}`,
                checked: false
            }));

            // 1. Sync Personal Grocery List
            const mergedPersonal = [...(personalGrocery.items || []), ...newItems];
            await fetch('/api/grocery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebaseUID: uid, items: mergedPersonal })
            });

            // 2. Sync Shared Family List (if attached to a group namespace)
            if (family) {
                const mergedFamily = [...(family.sharedGroceryList || []), ...newItems];
                await fetch(`/api/family/${family._id}/grocery`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sharedGroceryList: mergedFamily })
                });
            }

            setOrderingGroceries(false);
            setGroceriesOrdered(true);
            setTimeout(() => setGroceriesOrdered(false), 5000);
            
            // Dispatch event updates to maintain parallel sync across open dashboard components
            window.dispatchEvent(new CustomEvent('groceryUpdated'));
            toast.success("Ingredients added to your shopping list!");
        } catch (err) {
            console.error("Instacart sync error:", err);
            setOrderingGroceries(false);
            toast.error("Failed to sync ingredients list");
        }
    };

    const handleSubmitReview = async () => {
        if (!user) return toast.error("Please log in to leave a review.");
        if (rating === 0) return toast.error("Please select a star rating.");
        if (!reviewText.trim()) return toast.error("Please write a short review.");
        
        setSubmitting(true);
        try {
            const res = await fetch(`/api/recipes/${recipe._id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.firebaseUID,
                    userName: user.name,
                    userPhoto: user.photoURL,
                    score: rating,
                    review: reviewText
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setLocalRatings(updated.ratings);
                setSubmitted(true);
                setReviewText("");
                setRating(0);
            }
        } catch (err) {
            console.error("Review error:", err);
            toast.error("Could not post review at this time");
        }
        setSubmitting(false);
    };

    const handleShareRecipe = async () => {
        const shareUrl = recipe.sourceUrl || (typeof window !== 'undefined' ? window.location.href : '');
        const shareData = {
            title: recipe.title,
            text: `Try this recipe: ${recipe.title}`,
            url: shareUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                toast.success('Recipe shared');
                return;
            }
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            toast.success('Recipe link copied to clipboard');
        } catch (err) {
            if (err.name !== 'AbortError') toast.error('Could not share this recipe');
        }
    };

    const downloadRecipe = () => {
        toast.message("Opening print layout dialog");
        window.print();
    };

    if (!recipe) {
        return <div className="recipe-error-fallback">No recipe chosen to review.</div>;
    }

    return (
        <div className={`recipe-details-page ${isDark ? 'dark-mode' : ''}`}>
            <Header 
                user={user}
                onLogoClick={onLogoClick}
                onContactClick={onContactClick}
                onAboutClick={onAboutClick}
                onSubscriptionClick={onSubscriptionClick}
                onCommunityClick={onCommunityClick}
                onProductsClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'products' }))}
                onFamilyClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'family' }))}
                isDark={isDark}
                toggleDarkMode={toggleDarkMode}
                isAIEnabled={isAIEnabled}
                toggleAI={toggleAI}
                actionButton={user ? <span className="user-name">{user.name}</span> : <button onClick={onLoginClick}>Login</button>}
            />

            <main className="recipe-details-content">
                {/* Fixed Action Navigation Row with Functional Return Control Button */}
                <div className="recipe-action-row" data-html2canvas-ignore="true">
                    {onBack && (
                        <button onClick={onBack} className="back-nav-btn" style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'inherit' }}>
                            <ArrowLeft size={16} /> Back to Recipes
                        </button>
                    )}
                    <button
                        onClick={handleInstacartOrder}
                        disabled={orderingGroceries || groceriesOrdered}
                        style={{
                            padding: '8px 15px',
                            background: (orderingGroceries || groceriesOrdered) ? '#9ca3af' : '#10b981',
                            color: 'white',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: (orderingGroceries || groceriesOrdered) ? 'default' : 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background 0.3s'
                        }}
                    >
                        <ShoppingCart size={16} /> {orderingGroceries ? 'Syncing...' : groceriesOrdered ? 'Added!' : 'Order ingredients'}
                    </button>
                    <button 
                        onClick={handleShareRecipe}
                        style={{ padding: '8px 15px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Share2 size={16} /> Share
                    </button>
                    <button 
                        onClick={downloadRecipe} 
                        style={{ padding: '8px 15px', background: 'var(--primary-color, #6dba5f)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={16} /> Print / PDF
                    </button>
                </div>

                {/* Hero Layout Frame */}
                <div className="recipe-hero animate-fade-in">
                    <div className="recipe-hero-image">
                        <img
                            src={recipe.image || recipe.imageURL || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"}
                            alt={recipe.title}
                            crossOrigin="anonymous"
                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"; }}
                        />
                    </div>
                    <div className="recipe-hero-content">
                        <span className="recipe-badge">{recipe.tag || recipe.category || "Recipe"}</span>
                        <h1>{recipe.title}</h1>
                        <p className="recipe-description">{recipe.desc || ""}</p>

                        {/* Validated Health Conditional Checks */}
                        {isDiabetic && recipe.diabeticFlag && (
                            <div className="health-flag diabetic">
                                ⚠️ High Sugar — Diabetic users: {recipe.diabeticSafeQty || 'Limit serving'}
                            </div>
                        )}
                        {isHypertensive && recipe.sodiumContent > 600 && (
                            <div className="health-flag hypertension">
                                ⚠️ High Sodium — Limit to half serving
                            </div>
                        )}

                        <div className="recipe-meta-row">
                            <div className="meta-item">
                                <span className="meta-icon">⏱</span>
                                <div className="meta-text">
                                    <label>Time</label>
                                    <span>{recipe.time || '30 mins'}</span>
                                </div>
                            </div>
                            <div className="meta-item">
                                <span className="meta-icon">📊</span>
                                <div className="meta-text">
                                    <label>Difficulty</label>
                                    <span>{recipe.difficulty || 'Medium'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rating-section" data-html2canvas-ignore="true">
                            <label>Recipe Rating:</label>
                            <div className="star-display">
                                {'★'.repeat(Math.round(recipe.averageRating || 0))}{'☆'.repeat(5 - Math.round(recipe.averageRating || 0))}
                                <span className="rating-count">({recipe.totalRatings || localRatings.length})</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Processing Panels Grid */}
                <div className="recipe-content-grid animate-fade-up">
                    <section className="ingredients-card">
                        <h2>Ingredients</h2>
                        <ul className="ingredients-list" style={{ marginTop: '15px' }}>
                            {(recipe.ingredients || []).map((ing, idx) => (
                                <li key={idx}>
                                    <span className="dot"></span>
                                    {typeof ing === 'string' ? ing : `${ing.qty || ''} ${ing.unit || ''} ${ing.name || ''}`}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="instructions-card">
                        <h2>Instructions</h2>
                        <div className="instructions-text-block">
                            <ol>
                                {(recipe.steps || []).map((step, i) => <li key={i}>{step}</li>)}
                            </ol>
                        </div>
                    </section>

                    {/* Community Interface Block */}
                    <section className="reviews-card" style={{ gridColumn: '1 / -1', marginTop: '20px' }} data-html2canvas-ignore="true">
                        <h2>Community Reviews</h2>

                        {!submitted && user && (
                            <div className="review-submission">
                                <h3>Leave a Review</h3>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={star <= (hover || rating) ? "on" : "off"}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(rating)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={reviewText}
                                    onChange={e => setReviewText(e.target.value)}
                                    placeholder="Share your experience with this recipe..."
                                    rows={3}
                                />
                                <button
                                    className="submit-review-btn"
                                    onClick={handleSubmitReview}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Review →'}
                                </button>
                            </div>
                        )}

                        {submitted && <p className="success-msg">✓ Review submitted! Thank you.</p>}

                        <div className="reviews-list">
                            {localRatings && localRatings.length > 0 ? (
                                localRatings.map((r, idx) => (
                                    <div key={idx} className="review-item">
                                        <img src={r.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.userName}`} alt={r.userName} className="reviewer-avatar" />
                                        <div className="review-body">
                                            <div className="reviewer-meta">
                                                <strong>{r.userName}</strong>
                                                <span className="review-stars">{'★'.repeat(r.score)}</span>
                                            </div>
                                            <p className="review-text">{r.review}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-reviews">No reviews yet. Be the first to rate this recipe!</p>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default RecipeDetails;