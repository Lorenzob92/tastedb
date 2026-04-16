import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import "../styles/manga-theme.css";
import { Nav } from "@/components/nav";
import { ClientStoreProvider } from "@/components/store-provider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "tastedb",
  description: "Personal media taste tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${notoSansJP.variable} h-full antialiased dark`}
    >
      <body className="screentone-bg min-h-full flex flex-col bg-[#0a0a12] text-zinc-200">
        <ClientStoreProvider>
          <div className="relative z-10 flex flex-col min-h-full w-full max-w-7xl mx-auto">
            <Nav />
            <main className="flex flex-col flex-1 px-6 py-8">{children}</main>
          </div>
        </ClientStoreProvider>
      </body>
    </html>
  );
}
