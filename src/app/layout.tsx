import type { Metadata } from "next";
import { Geist, Geist_Mono, Gowun_Batang } from "next/font/google";
import { Nav } from "@/components/nav";
import { OnboardingModals } from "@/components/onboarding-modals";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gowunBatang = Gowun_Batang({
  variable: "--font-serif-kr",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "아름다운 문장",
  description: "매일 하나의 상황 문장을 나만의 문체로 다시 쓰는 소설 창작 커뮤니티",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${gowunBatang.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#faf9f6] text-slate-800 dark:bg-neutral-950 dark:text-slate-100">
        <OnboardingModals />
        <Nav />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
