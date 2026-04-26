import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
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
          <div className="flex h-screen overflow-hidden bg-background font-sans antialiased text-foreground">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
               <header className="h-16 border-b flex items-center justify-end px-6">
                 <ThemeToggle />
               </header>
               <main className="flex-1 overflow-y-auto">
                 {children}
               </main>
            </div>
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}