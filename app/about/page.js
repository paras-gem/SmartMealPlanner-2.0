"use client";
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Send, Star } from 'lucide-react';
import { auth } from '@/lib/firebaseConfig';
import '@/components/About.css';

export default function AboutPage() {
    const [feedback, setFeedback] = useState({ name: '', email: '', message: '', rating: 5 });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const user = auth.currentUser;

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebaseUID: user?.uid || 'Anonymous',
                    email: feedback.email || user?.email || '',
                    name: feedback.name || user?.displayName || '',
                    message: feedback.message,
                    rating: feedback.rating
                })
            });

            if (!res.ok) throw new Error("Failed to submit feedback");
            
            toast.success("Thank you for your feedback! ❤️");
            setFeedback({ name: '', email: '', message: '', rating: 5 });
        } catch (err) {
            toast.error("Failed to send feedback. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="about-page">
            <main className="about-content animate-fade-in" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                <section className="about-hero" style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '3rem', marginBottom: '20px' }}>Explore Your Palate 🎨</h2>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Inspiring home cooks to discover new flavors and celebrate every meal, one mood at a time.</p>
                </section>

                <section className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '60px' }}>
                    <div className="about-card animate-slide-up" style={{ animationDelay: '0.1s', padding: '30px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                        <span className="about-icon" style={{ fontSize: '2rem', display: 'block', marginBottom: '15px' }}>✧</span>
                        <h3 style={{ marginBottom: '15px' }}>Flavor Curation</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Our smart engine learns your tastes to suggest dishes you'll truly love, not just what's "good" for you.</p>
                    </div>
                    <div className="about-card animate-slide-up" style={{ animationDelay: '0.2s', padding: '30px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                        <span className="about-icon" style={{ fontSize: '2rem', display: 'block', marginBottom: '15px' }}>⌬</span>
                        <h3 style={{ marginBottom: '15px' }}>Nutrition First</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Every recipe is vetted for nutritional balance, ensuring you get the right macros every single day.</p>
                    </div>
                    <div className="about-card animate-slide-up" style={{ animationDelay: '0.3s', padding: '30px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                        <span className="about-icon" style={{ fontSize: '2rem', display: 'block', marginBottom: '15px' }}>⌘</span>
                        <h3 style={{ marginBottom: '15px' }}>Global Cuisine</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Discover traditional classics and modern fusions from cultures around the world.</p>
                    </div>
                </section>

                <section className="about-story" style={{ padding: '40px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-xl)', marginBottom: '60px' }}>
                    <h3 style={{ fontSize: '2rem', marginBottom: '20px' }}>Beyond Just Eating</h3>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
                        Started in 2026, SmartMeal was born from a love for variety.
                        We believe food should be an adventure, not a chore. Our
                        platform is designed to help you break out of your food rut
                        and find joy in every single bite.
                    </p>
                </section>

                {/* Feedback Section */}
                <section className="about-feedback" style={{ padding: '40px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '10px', textAlign: 'center' }}>We'd Love Your Feedback!</h3>
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '30px' }}>Help us make SmartMeal even better.</p>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name</label>
                            <input 
                                type="text" 
                                value={feedback.name} 
                                onChange={e => setFeedback({...feedback, name: e.target.value})} 
                                placeholder="Your Name (Optional)" 
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                            <input 
                                type="email" 
                                value={feedback.email} 
                                onChange={e => setFeedback({...feedback, email: e.target.value})} 
                                placeholder="Your Email (Optional)" 
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rating</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                        key={star} 
                                        size={24} 
                                        onClick={() => setFeedback({...feedback, rating: star})} 
                                        style={{ cursor: 'pointer', color: star <= feedback.rating ? 'gold' : 'var(--border)', fill: star <= feedback.rating ? 'gold' : 'none' }} 
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Message *</label>
                            <textarea 
                                required
                                value={feedback.message} 
                                onChange={e => setFeedback({...feedback, message: e.target.value})} 
                                placeholder="Tell us what you think..." 
                                rows="4"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-main)', boxSizing: 'border-box', resize: 'vertical' }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={submitting || !feedback.message.trim()}
                            style={{ padding: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (submitting || !feedback.message.trim()) ? 0.7 : 1 }}
                        >
                            <Send size={18} /> {submitting ? 'Sending...' : 'Send Feedback'}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
}
