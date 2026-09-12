import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@copilotkit/react-ui/styles.css";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrderCare",
  description: "AI customer support embedded in your order page",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Providers>
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-2xl mx-auto w-full px-6 py-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-semibold text-sm">
                OC
              </span>
              <span className="font-semibold text-slate-900">OrderCare</span>
            </div>
          </header>
          <div className="flex-1 flex flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
