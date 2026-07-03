"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/components/Product.css'; // Optional custom styles

export default function ProductsPage() {
    const router = useRouter();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchSource, setFetchSource] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
        if (searchTerm.trim()) {
            loadRecipes(searchTerm.trim());
        } else {
            loadRecipes('chicken');
        }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

    const loadRecipes = async (query) => {
        try {
            setLoading(true);
            setRecipes([]);
            setFetchSource('');

            const res = await fetch(`/api/recipes?query=${encodeURIComponent(query)}`);
            if (!res.ok) {
                const errData = await res.text();
                throw new Error(errData || `HTTP ${res.status}`);
            }

            const data = await res.json();
            const items = data.recipes || [];
            setRecipes(items);
            setFetchSource('🌐 Live from TheMealDB');
        } catch (err) {
            console.error('Failed to fetch recipes:', err);
            setRecipes([]);
            setFetchSource('❌ Connection Error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        const query = searchTerm.trim() || 'chicken';
        await loadRecipes(query);
    };

    return (
        <div className="products-page animate-fade-in" style={{ minHeight: '100vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>Explore Recipes</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Browse our curated collection of healthy and delicious meals.
                    </p>
                    {fetchSource && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '6px 16px', borderRadius: '20px', display: 'inline-block', marginTop: '12px', fontWeight: '600' }}>
                            {fetchSource}
                        </span>
                    )}
                </div>

                <form onSubmit={handleSearch} style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search any ingredient, dish, or category (e.g. dessert, pasta)..."
                        style={{ width: '100%', maxWidth: '560px', padding: '14px 20px', borderRadius: '50px', border: '1px solid var(--border)', outline: 'none', fontSize: '1rem', background: 'var(--bg-card)', color: 'var(--text-main)', boxShadow: 'var(--shadow)' }}
                    />
                    <button type="submit" style={{ padding: '14px 30px', minWidth: '140px', background: 'var(--primary-color)', color: 'white', borderRadius: '50px', fontWeight: '700', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                        Search
                    </button>
                </form>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '1200px' }}>
                        {loading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} style={{
                                        height: '320px', background: 'var(--bg-hover)',
                                        borderRadius: 'var(--radius-xl)', animation: 'pulse 1.5s infinite'
                                    }} />
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                                {recipes.map((recipe) => (
                                    <div
                                        key={recipe.id}
                                        style={{
                                            background: 'var(--bg-card)',
                                            borderRadius: 'var(--radius-xl)',
                                            border: '1px solid var(--border)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            cursor: 'pointer',
                                            boxShadow: 'var(--shadow)',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onClick={() => router.push(`/recipe/${recipe.id}`)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'var(--shadow)';
                                        }}
                                    >
                                        <div style={{ position: 'relative', height: '200px', width: '100%', overflow: 'hidden' }}>
                                            <img
                                                src={recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400"}
                                                alt={recipe.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400"; }}
                                            />
                                        </div>
                                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
                                                {recipe.cuisineType || 'Global'}
                                            </span>
                                            <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', lineHeight: '1.4' }}>{recipe.title}</h4>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto' }}>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600' }}>
                                                    🔥 {Math.round(recipe.calories)} kcal
                                                </span>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                    ⏱ {recipe.readyInMinutes} min
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {recipes.length === 0 && (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🍽️</div>
                                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No recipes found!</h3>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Try another search term or refresh the page.</p>
                                        <button style={{ padding: '12px 30px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '30px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-main)' }} onClick={() => loadRecipes('chicken')}>Retry with default →</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}