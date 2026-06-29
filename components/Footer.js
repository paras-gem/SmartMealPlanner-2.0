import React from 'react';
import './Footer.css'; // Make sure this points cleanly to your footer styles

const Footer = ({ tagline = "Better Meals, Better Life ✨" }) => {
    return (
        <footer className="site-footer">
            <div className="footer-container" style={{ textAlign: 'center', padding: '20px' }}>
                <p>© {new Date().getFullYear()} SmartMeal Planner | {tagline}</p>
            </div>
        </footer>
    );
};

export default Footer;