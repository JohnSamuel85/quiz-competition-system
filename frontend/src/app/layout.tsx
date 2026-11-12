import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "Aethelgard | Premium Competitive Quiz Arena",
  description: "Intellectually demanding 50-question master quiz competitions: 25 Advanced Bible Knowledge and 25 Advanced General Knowledge challenges with synchronized voice narration and 20-second timers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080a10] text-[#f3f4f6] min-h-screen flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-[#1a2030] py-6 text-center text-xs text-gray-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-300">Aethelgard Quiz Arena</span>
                <span>•</span>
                <span>50-Question Daily Master Competitions</span>
              </div>
              <div className="text-gray-400">
                Single-Service Full-Stack Deployment • FastAPI + Next.js
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
