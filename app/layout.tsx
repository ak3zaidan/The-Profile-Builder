import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Profile Builder - Checkout Bot Profile Builder",
  description: "Generate checkout bot profiles for Make, Stellar, Valor, and more",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { marginTop: '5rem' }
          }}
          className="toast"
        />
      </body>
    </html>
  )
}
