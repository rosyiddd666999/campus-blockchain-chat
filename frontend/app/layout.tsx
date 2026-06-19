import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Campus Blockchain Chat",
  description: "Komunitas Q&A Teknik Informatika dengan reward CSIT token",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <Navbar />
          <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
            <Sidebar />
            <main className="flex-1 min-w-0 py-6 md:pl-8 pb-24 md:pb-6">
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}