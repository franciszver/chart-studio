import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { ApolloProviderWrapper } from '@/components/providers/apollo-provider';
import { LoadingProvider } from '@/components/providers/loading-provider';
import DevOverlayHider from '@/components/common/dev-overlay-hider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leap Dashboard Studio",
  description: "AI-First CRM Reporting & Dashboard Platform built with Next.js",
  icons: {
    icon: [
      {
        url: '/favicon.png',
        type: 'image/png',
      },
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ApolloProviderWrapper>
            <LoadingProvider>
              <DevOverlayHider />
              {children}
            </LoadingProvider>
          </ApolloProviderWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
