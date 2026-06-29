"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import "@/components/SmartMealPlanner.css"; 

// Local layout data configurations
const sliderImages = [
    {
        title: "Smart Meal Planning Made Simple",
        subtitle: "Customized nutrition layouts tailored to your fitness goals and dietary restrictions.",
        image: "https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=1200"
    },
    {
        title: "Track Macros Effortlessly",
        subtitle: "Get instant caloric tracking breakdowns pulled directly from real ingredients.",
        image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200"
    }
];

const plannerFeatures = [
    { icon: "🍳", title: "Smart Generation", desc: "Automate automated weekly recipe books targeted directly to your caloric ceiling." },
    { icon: "🛒", title: "Groceries Auto-List", desc: "Instantly consolidate layout ingredients directly into checkable shopping sheets." },
    { icon: "📊", title: "Macro Dashboards", desc: "Monitor automated nutrition analytics across customized daily views." }
];

const plannerTrending = [
    {
        title: "Mediterranean Avocado Salad",
        desc: "High healthy fat ratios combined with lean natural greens.",
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500",
        icon: "🥗"
    },
    {
        title: "High Protein Berry Parfait",
        desc: "Low calorie density morning meal built for recovery cycles.",
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500",
        icon: "🍓"
    }
];

export default function SmartMealPlannerPage({
    user, onRecipeClick, onProductsClick, isDark
}) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const recipesRef = useRef(null);

    useEffect(() => {
        fetchRecipes();
    }, [user]);

    useEffect(() => {
        if (!sliderImages.length) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

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
            
            // Fixed URL: Changed from /api/recipes/search to /api/recipe/search
            const response = await fetch(`/api/recipe/search?query=${encodeURIComponent(query)}&number=8`);
            
            if (!response.ok) {
                throw new Error(`HTTP Error Status: ${response.status}`);
            }

            const result = await response.json();
            setRecipes(Array.isArray(result.recipes) ? result.recipes : []);
        } catch (error) {
            console.error("Failed to fetch recipes from route:", error);
            setRecipes([]);
        } finally {
            setLoading(false);
        }
    };

    const scrollToPlanner = () => {
        recipesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className={`smart-meal-planner animate-fade-in ${isDark ? "dark-mode" : ""}`}>
            <section className="hero">
                <div className="hero-slider">
                    {sliderImages.map((slide, index) => (
                        <div
                            key={index}
                            className={`slide ${index === currentSlide ? "active" : ""}`}
                            style={{ backgroundImage: `url(${slide.image})` }}
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
                            <div className="recipe-img-wrapper" style={{ position: "relative", height: "200px", width: "100%" }}>
                                <Image 
                                    src={item.image} 
                                    alt={item.title}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    unoptimized
                                />
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
                            <div key={recipe.spoonacularId} className="recipe-card" onClick={() => onRecipeClick && onRecipeClick(recipe)} style={{ cursor: 'pointer' }}>
                                <div className="recipe-img-wrapper" style={{ position: "relative", height: "200px", width: "100%" }}>
                                    <Image 
                                        src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} 
                                        alt={recipe.title} 
                                        fill
                                        style={{ objectFit: "cover" }}
                                        unoptimized
                                    />
                                </div>
                                <div className="recipe-content">
                                    <span className="recipe-badge">{recipe.category || 'Recipe'}</span>
                                    <h4>{recipe.title}</h4>
                                    <div className="recipe-meta" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        {recipe.readyInMinutes && <span>⏱ {recipe.readyInMinutes} min</span>}
                                        <span>🔥 {recipe.calories} kcal</span>
                                        <span>⭐ {recipe.averageRating?.toFixed(1) || '4.5'}</span>
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