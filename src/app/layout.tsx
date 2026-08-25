import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR, Nanum_Gothic_Coding, Nanum_Gothic } from "next/font/google";
import { Nav } from "@/components/nav";
import { PageChrome } from "@/components/page-chrome";
import { OnboardingModals } from "@/components/onboarding-modals";
import "./globals.css";

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif-kr",
  display: "swap",
});

const nanumGothicCoding = Nanum_Gothic_Coding({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono-kr",
  display: "swap",
});

const nanumGothic = Nanum_Gothic({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-sans-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "아름다운 문장",
  description: "매일 하나의 상황 문장을 나만의 문체로 다시 쓰는 소설 창작 커뮤니티",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#5C3E28",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSerifKR.variable} ${nanumGothicCoding.variable} ${nanumGothic.variable} h-full antialiased`}
    >
      <body className="desk-surface flex min-h-full flex-col items-center px-4 py-8 sm:py-16">
        <OnboardingModals />
        <PageChrome nav={<Nav />}>{children}</PageChrome>
      </body>
    </html>
  );
}
