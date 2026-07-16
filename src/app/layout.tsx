import type { Metadata } from 'next'
import { Inter, Noto_Sans_TC } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const notoSansTC = Noto_Sans_TC({ subsets: ['latin'], variable: '--font-noto-sans-tc', weight: ['400', '500', '700'] })

export const metadata: Metadata = {
  title: 'WisePrep — 台灣科技業面試準備教練',
  description: '根據目標公司與職缺類型，準備台灣科技業面試的個人化教練平台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.variable} ${notoSansTC.variable} font-sans antialiased bg-white`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
