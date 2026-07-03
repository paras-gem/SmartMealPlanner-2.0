import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "SmartMeal Planner",
  description: "Personalized meal planning made simple",
};

import Chatbot from "@/components/Chatbot";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh", margin: 0 }}>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          {/* Global Header */}
          <Header />

          <main style={{ flex: "1 0 auto" }}>
            {children}
          </main>

          {/* Global Footer */}
          <Footer />

          {/* Chatbot Floating UI */}
          <Chatbot />

          {/* Sonner toast notifications */}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                borderRadius: "12px",
                fontFamily: "var(--font-inter)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}