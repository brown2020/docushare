
import type { Metadata } from "next";

import "./globals.css";
import "./../assets/GeneralSans/WEB/css/general-sans.css"
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";
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
    <ClerkProvider dynamic>
       <ActiveDocProvider>
        <html lang="en" className="h-full">
          <body className="flex flex-col h-full">
            <Header />
            <div className="flex flex-col h-full flex-1 bg-white overflow-y-auto">
              {children}
            </div>
            <Toaster position="top-right" />
          </body>
        </html>
       </ActiveDocProvider>
    </ClerkProvider>
  );
}
