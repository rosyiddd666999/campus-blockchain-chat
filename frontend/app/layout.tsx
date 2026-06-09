import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TransactionStatus } from "@/components/web3/TransactionStatus";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "ICP Chat — Campus Blockchain Community",
  description: "Platform Q&A dan Chat berbasis Web3 untuk mahasiswa Teknik Informatika. Dapatkan reward token CSIT Sepolia untuk setiap kontribusi Anda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('icp-chat-theme') || 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground grid-bg selection:bg-emerald-500 selection:text-white">
        <Web3Provider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="mx-auto flex w-full max-w-7xl flex-1 items-start px-4 py-6 sm:px-6 lg:px-8 gap-4">
              <Sidebar />
              <main className="flex-1 min-w-0 w-full pb-20 md:pb-0">
                {children}
              </main>
            </div>
            <TransactionStatus />
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
