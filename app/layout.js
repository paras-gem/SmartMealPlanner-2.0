import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Adjust these import paths depending on exactly where your Header and Footer files live
import Header from "@/components/Header"; 
import Footer from "@/components/Footer"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SmartMeal Planner",
  description: "Personalized meal planning made simple",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* Called once globally - updates here reflect site-wide */}
        <Header />

        {/* This main tag ensures the content expands to push the footer down */}
        <main style={{ flex: '1 0 auto' }}>
          {children}
        </main>

        {/* Called once globally */}
        <Footer />

      </body>
    </html>
  );
}