"use client"
import React, { useState } from "react";
import "@/styles/ProfileSetup.css";
import Header from "./Header.js"; // Adjust this path based on your folder structure

const ProfileSetup = ({ 
    user, 
    onComplete, 
    isDark, 
    toggleDarkMode, 
    isAIEnabled, 
    toggleAI 
}) => {
    const [formData, setFormData] = useState({
        age: "",
        weight: "",
        height: "",
        gender: "Male",
        goal: "Healthy",
        mealPreference: "Veg"
    });

    // Calculates BMI dynamically as the user types weight and height
    const calculatedBMI = (formData.weight && formData.height)
        ? (formData.weight / Math.pow(formData.height / 100, 2)).toFixed(1)
        : null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Central dispatcher for Header actions mimicking client-side event routing
    const handleNavigation = (destination) => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: destination }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const identifier = user?.firebaseUID || user?.email;
            if (!identifier) {
                console.error("No user identifier found for profile setup");
                return;
            }

            console.log("[ProfileSetup] Saving measurements for:", identifier);
            await fetch(`/api/users/${identifier}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user?.email, // Fallback identifier for backend handlers
                    measurements: {
                        age: formData.age,
                        weight: formData.weight,
                        height: formData.height,
                        bmi: calculatedBMI,
                        gender: formData.gender
                    },
                    goal: formData.goal,
                    mealPreference: formData.mealPreference
                })
            });
        } catch (err) {
            console.error("Failed to save preferences:", err);
        }
        
        // Pass the fresh profile state back up to the parent flow manager
        if (onComplete) {
            onComplete({ 
                ...user, 
                profile: formData, 
                mealPreference: formData.mealPreference, 
                goal: formData.goal 
            });
        }
    };

    return (
        <div className={`profile-setup-container animate-fade-in ${isDark ? "dark-mode" : ""}`}>
            <div className="bg-decoration"></div>

            <Header 
                user={user}
                onLogoClick={() => handleNavigation('dashboard')}
                onContactClick={() => handleNavigation('contact')}
                onAboutClick={() => handleNavigation('about')}
                onSubscriptionClick={() => handleNavigation('subscription')}
                onCommunityClick={() => handleNavigation('community')}
                onProductsClick={() => handleNavigation('products')}
                onFamilyClick={() => handleNavigation('family')}
                isDark={isDark}
                toggleDarkMode={toggleDarkMode}
                isAIEnabled={isAIEnabled}
                toggleAI={toggleAI}
                actionButton={<span className="user-name">{user?.name || "User"}</span>}
            />

            <main className="setup-card animate-pop-in">
                <h2>Your Culinary Adventure 🍳</h2>
                <p>Tell us about your preferences so we can find recipes that match your taste buds perfectly.</p>

                <form onSubmit={handleSubmit} className="setup-form">
                    {/* Age Input */}
                    <div className="form-group animate-slide-up" style={{ animationDelay: "0.1s" }}>
                        <label>Age</label>
                        <input
                            type="number"
                            name="age"
                            placeholder="e.g. 25"
                            value={formData.age}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Weight & Height Row */}
                    <div className="form-row">
                        <div className="form-group animate-slide-up" style={{ animationDelay: "0.2s" }}>
                            <label>Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                placeholder="e.g. 70"
                                value={formData.weight}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group animate-slide-up" style={{ animationDelay: "0.3s" }}>
                            <label>Height (cm)</label>
                            <input
                                type="number"
                                name="height"
                                placeholder="e.g. 175"
                                value={formData.height}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Gender & Goals Row */}
                    <div className="form-row">
                        <div className="form-group animate-slide-up" style={{ animationDelay: "0.35s" }}>
                            <label>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group animate-slide-up" style={{ animationDelay: "0.4s" }}>
                            <label>Primary Goal</label>
                            <select name="goal" value={formData.goal} onChange={handleChange}>
                                <option value="Weight Loss">Weight Loss 📉</option>
                                <option value="Muscle Gain">Muscle Gain 💪</option>
                                <option value="Healthy">Stay Healthy 🥗</option>
                                <option value="Energy">More Energy ⚡</option>
                            </select>
                        </div>
                    </div>

                    {/* Meal Preferences Selection */}
                    <div className="form-group animate-slide-up" style={{ animationDelay: "0.45s" }}>
                        <label>Meal Preference</label>
                        <select name="mealPreference" value={formData.mealPreference} onChange={handleChange}>
                            <option value="Veg">Veg</option>
                            <option value="Vegan">Vegan</option>
                            <option value="Non-Veg">Non-Veg</option>
                            <option value="Healthy">Healthy</option>
                            <option value="Quick">Quick Meals</option>
                        </select>
                    </div>

                    {/* Dynamic BMI Section */}
                    {calculatedBMI && (
                        <div className="bmi-indicator animate-pop-in" style={{ padding: "15px", background: "rgba(109,186,95,0.1)", borderRadius: "8px", margin: "10px 0", textAlign: "center" }}>
                            <strong>Your Estimated BMI: <span style={{ color: "var(--primary-color)" }}>{calculatedBMI}</span></strong>
                        </div>
                    )}

                    {/* Action Triggers */}
                    <button type="submit" className="generate-btn animate-slide-up" style={{ animationDelay: "0.5s" }}>
                        Generate My Plan →
                    </button>
                    <button type="button" className="skip-btn animate-slide-up" style={{ animationDelay: "0.6s" }} onClick={() => onComplete && onComplete({})}>
                        Skip for now
                    </button>
                </form>
            </main>
        </div>
    );
};

export default ProfileSetup;