import type { Metadata } from "next";

import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import BottomNavigation from "./components/BottomNavigation";
import { EventCreationProvider } from "./contexts/EventCreationContext";
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ticketi",
  description: "Create events, buy tickets, share and collaborate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const router = useRouter();
  // const handleMyEvents = () => {
  //   router.push("/my-events");
  // };
  
  // const handleProfile = () => {
  //   router.push("/profile");
  // };

  
  return (
    <html lang="en" className={`${fredoka.className} ${nunito.className}`}>
      <head>
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
        />
        <Script src="https://kit.fontawesome.com/1e3c5331c9.js" strategy="beforeInteractive"/>
      </head>
      <body className={`${fredoka.variable} ${nunito.variable} antialiased pb-20`}>
        <EventCreationProvider>
          <div className="min-h-screen">
            {children}
          </div>
          <BottomNavigation />
        </EventCreationProvider>
      </body>
    </html>
  );
}
