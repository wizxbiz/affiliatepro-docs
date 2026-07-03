import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TukTuk Thailand | ดูเพลิน ช้อป OTOP ทั่วไทย",
  description: "แพลตฟอร์มวิดีโอสั้นและตลาดออนไลน์สำหรับสินค้า OTOP และของดีประจำจังหวัดจากทั่วประเทศไทย",
  metadataBase: new URL('https://tuktukfeed.com'),
  openGraph: {
    title: "TukTuk Thailand | ดูเพลิน ช้อป OTOP ทั่วไทย",
    description: "แพลตฟอร์มวิดีโอสั้นและตลาดออนไลน์สำหรับสินค้า OTOP และของดีประจำจังหวัดจากทั่วประเทศไทย",
    url: 'https://tuktukfeed.com',
    siteName: 'TukTuk Thailand',
    images: [
      {
        url: '/logo.png', // Public static logo fallback
        width: 512,
        height: 512,
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
