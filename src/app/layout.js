import { Karla } from "next/font/google";
import Script from "next/script";
import { FrameInit } from "@/components/frame-init";
import "./globals.css";

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
});

export const metadata = {
  title: "Casts & Colors",
  description: "Like casts and cocktails but for colors",
  other: {
    'fc:frame': JSON.stringify({
      version: "next",
      imageUrl: "https://cover-art.kasra.codes/cocktails-image.png",
      button: {
        title: "Find Your Color",
        action: {
          type: "launch_frame",
          name: "Find Your Color",
          url: process.env.NEXT_PUBLIC_BASE_URL,
          splashImageUrl: "https://cover-art.kasra.codes/cocktails-icon-512.png",
          splashBackgroundColor: "#FF5722"
        }
      }
    })
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/@farcaster/frame-sdk/dist/index.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={karla.variable}>
        {children}
        <FrameInit />
      </body>
    </html>
  );
}
