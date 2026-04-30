import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GIK Scheduler App",
  description: "Advanced CSP timetabling schedule generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
            <Navbar />
            {/* 56px offset for fixed navbar */}
            <div style={{ height:"56px", flexShrink:0 }} />
            <main style={{ flex:1, overflow:"hidden" }}>
              {children}
            </main>
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
