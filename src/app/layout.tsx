import type { Metadata } from "next";
import { Syne, Outfit, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/providers/CartProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { PdpThemeProvider } from "@/components/product/PdpTheme";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { getLayoutData } from "@/lib/layout-data";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const brand = Cormorant_Garamond({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Gaanabajana — Musical Instruments Online",
    template: "%s · Gaanabajana",
  },
  description:
    "Buy guitars, keyboards, drums, and studio gear online in India at Gaanabajana.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { categories, settings } = await getLayoutData();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${brand.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p.indexOf("/admin")===0){document.documentElement.setAttribute("data-theme","light");return;}var t=localStorage.getItem("site-theme")||localStorage.getItem("pdp-theme");if(t!=="dark"&&t!=="light")t="dark";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <CartProvider>
          <ToastProvider>
            <PdpThemeProvider>
              <Header categories={categories} settings={settings} />
              <main className="flex-1">{children}</main>
              <Footer settings={settings} />
              <MobileBottomNav />
            </PdpThemeProvider>
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
