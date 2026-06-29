"use client";

import React, { useState, useRef, useEffect } from "react";
// Ensure this path points correctly to your global or component-specific styles
import "@/styles/SmartMealPlanner.css"; 

// SAFE IMPORT: Adjusted to match Next.js standards. 
// Change this path if your Header component resides elsewhere (e.g., "@/components/Header")
import Header from "@/components/Header"; 

import {
    plannerFeatures as fallbackPlannerFeatures,
    sliderImages as fallbackSliderImages,
    plannerTrending as fallbackPlannerTrending
} from "@/lib/homePageData.js";

export default function SmartMealPlannerPage({
    user, onLoginClick, onLogoClick, onAboutClick, onContactClick, onSubscriptionClick,
    onCommunityClick, isDark, toggleDarkMode, onRecipeClick, onProductsClick,
    onLogoutClick
}) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [plannerFeatures, setPlannerFeatures] = useState([]);
    const [sliderImages, setSliderImages] = useState([]);
    const [plannerTrending, setPlannerTrending] = useState([]);

    const recipesRef = useRef(null);

    useEffect(() => {
        fetchHomePageData();
    }, []);

    useEffect(() => {
        fetchRecipes();
    }, [user]);

    useEffect(() => {
        if (!sliderImages.length) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [sliderImages]);

    const fetchHomePageData = async () => {
        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        try {
            const response = await fetch("/api/homepage", requestOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log("Home page data from backend:", result);

            setSliderImages(Array.isArray(result.sliderImages) ? result.sliderImages : []);
            setPlannerFeatures(Array.isArray(result.plannerFeatures) ? result.plannerFeatures : []);
            setPlannerTrending(Array.isArray(result.plannerTrending) ? result.plannerTrending : []);
        } catch (error) {
            console.warn("Homepage API unavailable, using local content fallback:", error);
            setSliderImages(fallbackSliderImages);
            setPlannerFeatures(fallbackPlannerFeatures);
            setPlannerTrending(fallbackPlannerTrending);
        }
    };

    const buildRecipeQuery = () => {
        const preference = user?.mealPreference || user?.profile?.goal || 'Healthy';
        const normalized = String(preference).toLowerCase().trim();

        if (['veg', 'vegetarian'].includes(normalized)) return 'vegetarian dinner';
        if (normalized === 'vegan') return 'vegan dinner';
        if (['non-veg', 'non-vegetarian'].includes(normalized)) return 'non vegetarian dinner';
        if (normalized === 'weight loss') return 'healthy weight loss meals';
        if (normalized === 'muscle gain') return 'high protein meals';
        if (normalized === 'energy') return 'energy boosting recipes';
        if (normalized === 'comfort') return 'comfort food recipes';
        if (normalized === 'quick') return 'quick easy meals';
        if (normalized === 'sweet') return 'dessert recipes';
        return `${preference} recipes`;
    };

    const fetchRecipes = async () => {
        try {
            setLoading(true);
            const query = buildRecipeQuery();
            const response = await fetch(`/api/recipes/search?query=${encodeURIComponent(query)}&number=8`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            const items = Array.isArray(result.recipes) ? result.recipes : [];
            setRecipes(items);
        } catch (error) {
            console.error("Failed to fetch recipes:", error);
            setRecipes([]);
        } finally {
            setLoading(false);
        }
    };

    const scrollToPlanner = () => {
        recipesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    if (!sliderImages.length) {
        return (
            <div className={`smart-meal-planner animate-fade-in ${isDark ? "dark-mode" : ""}`}>
                <Header
                    user={user}
                    onLogoClick={onLogoClick}
                    onContactClick={onContactClick}
                    onAboutClick={onAboutClick}
                    onSubscriptionClick={onSubscriptionClick}
                    onCommunityClick={onCommunityClick}
                    onProductsClick={onProductsClick}
                    onFamilyClick={() => window.dispatchEvent(new CustomEvent("navigate", { detail: "family" }))}
                    onLogoutClick={onLogoutClick}
                    isDark={isDark}
                    toggleDarkMode={toggleDarkMode}
                    actionButton={!user ? <button onClick={onLoginClick} className="login-btn">Login</button> : null}
                    activePage="home"
                />
                <div style={{ padding: "120px 20px", textAlign: "center" }}>
                    <h2>Loading home page...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className={`smart-meal-planner animate-fade-in ${isDark ? "dark-mode" : ""}`}>
            <Header
                user={user}
                onLogoClick={onLogoClick}
                onContactClick={onContactClick}
                onAboutClick={onAboutClick}
                onSubscriptionClick={onSubscriptionClick}
                onCommunityClick={onCommunityClick}
                onProductsClick={onProductsClick}
                onFamilyClick={() => window.dispatchEvent(new CustomEvent("navigate", { detail: "family" }))}
                onLogoutClick={onLogoutClick}
                isDark={isDark}
                toggleDarkMode={toggleDarkMode}
                actionButton={!user ? <button onClick={onLoginClick} className="login-btn">Login</button> : null}
                activePage="home"
            />

            <section className="hero">
                <div className="hero-slider">
                    {sliderImages.map((slide, index) => (
                        <div
                            key={index}
                            className={`slide ${index === currentSlide ? "active" : ""}`}
                            style={{ backgroundImage: `url(${slide.url})` }}
                        >
                            <div className="hero-overlay"></div>
                        </div>
                    ))}
                </div>
                <div className="hero-content">
                    <h2 key={`title-${currentSlide}`} className="animate-hero-title">
                        {sliderImages[currentSlide]?.title} ≎
                    </h2>
                    <p key={`text-${currentSlide}`} className="animate-hero-text">
                        {sliderImages[currentSlide]?.subtitle}
                    </p>
                    <button onClick={scrollToPlanner} className="cta-button animate-hero-btn">
                        <span>Start Planning</span>
                    </button>
                    <div className="slider-dots">
                        {sliderImages.map((_, index) => (
                            <span
                                key={index}
                                className={`dot ${index === currentSlide ? "active" : ""}`}
                                onClick={() => setCurrentSlide(index)}
                            ></span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="features">
                {plannerFeatures.map((feature, index) => (
                    <div
                        key={index}
                        className="card animate-fade-up"
                        style={{ animationDelay: `${(index + 1) * 0.2}s` }}
                    >
                        <h3>{feature.icon} {feature.title}</h3>
                        <p>{feature.desc}</p>
                    </div>
                ))}
            </section>

            <section className="trending-section animate-fade-in" style={{ padding: "0 24px 80px", maxWidth: "1200px", margin: "0 auto" }}>
                <h2 className="section-title">Trending This Week ⍋</h2>
                <div className="trending-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
                    {plannerTrending.map((item, idx) => (
                        <div key={idx} className="recipe-card" onClick={() => { if (onProductsClick) onProductsClick(); }}>
                            <div className="recipe-img-wrapper">
                                <img src={item.image} alt={item.title} />
                            </div>
                            <div className="recipe-content">
                                <span className="recipe-badge">{item.icon} Trending</span>
                                <h4>{item.title}</h4>
                                <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "15px" }}>{item.desc}</p>
                                <button className="view-details-btn">View All Products →</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="categories-section animate-fade-in" style={{ textAlign: "center", padding: "60px 20px", background: "var(--card-light)", margin: "40px auto", maxWidth: "800px", borderRadius: "16px" }}>
                <h2 className="section-title" style={{ marginBottom: "15px" }}>Explore All Recipes ≎</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
                    Discover our complete collection of delicious and healthy meals, tailored to your dietary needs and goals.
                </p>
                <button
                    onClick={() => { if (onProductsClick) onProductsClick(); }}
                    className="cta-button"
                    style={{ background: "var(--primary-color, #6dba5f)", color: "var(--primary-text)", padding: "15px 40px", fontSize: "1.1rem", borderRadius: "30px", border: "none", cursor: "pointer", fontWeight: "bold" }}
                >
                    View All Products & Recipes →
                </button>
            </section>

            <section ref={recipesRef} className="recommended-section animate-fade-in" style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <h2 className="section-title">Recommended Recipes</h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Recipes selected for you from Spoonacular based on your profile preferences.
                        </p>
                    </div>
                    <button
                        onClick={() => fetchRecipes()}
                        className="cta-button"
                        style={{ borderRadius: '999px', padding: '12px 24px', fontSize: '0.95rem' }}
                    >
                        Refresh Recipes
                    </button>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginTop: '24px' }}>
                        {[...Array(6)].map((_, idx) => (
                            <div key={idx} style={{ height: '300px', borderRadius: '18px', background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }} />
                        ))}
                    </div>
                ) : recipes.length ? (
                    <div className="recipe-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', marginTop: '24px' }}>
                        {recipes.map((recipe) => (
                            <div key={recipe._id || recipe.spoonacularId} className="recipe-card" onClick={() => onRecipeClick && onRecipeClick(recipe)} style={{ cursor: 'pointer' }}>
                                <div className="recipe-img-wrapper">
                                    <img src={recipe.imageURL || recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} alt={recipe.title} />
                                </div>
                                <div className="recipe-content">
                                    <span className={`recipe-badge ${recipe.category?.toLowerCase()?.replace(/\s+/g, '')}`}>{recipe.category || 'Recipe'}</span>
                                    <h4>{recipe.title}</h4>
                                    <div className="recipe-meta" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        {recipe.readyInMinutes && <span>⏱ {recipe.readyInMinutes} min</span>}
                                        <span>🔥 {typeof recipe.calories === 'number' ? Math.round(recipe.calories) : recipe.calories || 'N/A'} kcal</span>
                                        <span>⭐ {recipe.averageRating?.toFixed(1) || 'New'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ marginTop: '24px', padding: '30px', borderRadius: '18px', background: 'var(--bg-secondary)', textAlign: 'center' }}>
                        <h3>No recipes available right now.</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Try again or update your preferences.</p>
                    </div>
                )}
            </section>
        </div>
    );
}