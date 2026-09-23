import type { Metadata } from "next";

import "./globals.css";
import "./../assets/GeneralSans/WEB/css/general-sans.css";
import { AuthProvider } from "@/providers/AuthProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import { ActiveDocProvider } from "@/components/ActiveDocContext";

export const metadata: Metadata = {
  title: "Docushare AI",
  description: "Share and collaborate on docs with AI tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col h-full">
        <AuthProvider>
          <ActiveDocProvider>
            <Header />
            <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-neutral-950 overflow-y-auto">
              {children}
            </div>
            <Footer />
            <Toaster position="top-right" />
          </ActiveDocProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
