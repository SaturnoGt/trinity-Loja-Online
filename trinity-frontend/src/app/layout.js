import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FavoritesProvider } from "../context/FavoritesContext";

import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import "./globals.css";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TRINITY",
  description: "Loja Oficial Trinity",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-zinc-950 text-white">

        <AuthProvider>

          <CartProvider>

            <FavoritesProvider>

              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={12}
                toastOptions={{
                  duration: 3000,

                  style: {
                    background: "#18181b",
                    color: "#fff",
                    border: "1px solid #3f3f46",
                    borderRadius: "16px",
                    padding: "16px",
                    fontWeight: "600",
                  },

                  success: {
                    iconTheme: {
                      primary: "#22c55e",
                      secondary: "#fff",
                    },
                  },

                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />

              <Navbar />

              <main className="flex-1">
                {children}
              </main>

              <Footer />

            </FavoritesProvider>

          </CartProvider>

        </AuthProvider>

      </body>
    </html>
  );
}