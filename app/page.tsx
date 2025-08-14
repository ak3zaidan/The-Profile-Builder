"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Shield, Users, CreditCard, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import PoweredBy from "./components/poweredBy"
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [status, setStatus] = useState<"loading" | "not-logged" | "logged" | "error">("loading");
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const getCookie = (name: string) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? decodeURIComponent(match[2]) : null;
        };

        const userId = getCookie("userId");
        if (!userId) {
          setStatus("not-logged");
          return;
        }

        setStatus("logged")
        const response = await fetch("/api/oauth/subscription/status");
        const data = await response.json();

        if (!response.ok || !data.subscribed) {
          return;
        } else {
          setStatus("logged")
        }

      } catch (e) {
        console.error("Error checking access:", e);
        setStatus("error");
      }
    };

    checkAccess();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 backdrop-blur-sm bg-white/90 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">The Profile Builder</span>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Profile Builder
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate checkout bot profiles for Make, Stellar, Valor, and more. Create hundreds of profiles in seconds
            with advanced jigging and VCC integration.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              onClick={() => {
                if (status == "logged") {
                  router.push("/builder");
                } else {
                  router.push("/api/oauth/init?next=/builder");
                }
              }}
            >
              {status === "logged" ? "Start Building!" : "Login to get started"}
            </Button>
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 px-8 py-3 text-base transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            >
              Preview Features
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          <Card className="bg-white border-gray-200 shadow-sm mb-6 transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-col items-center text-center">
              <Zap className="w-8 h-8 text-blue-500 mb-3" />
              <CardTitle className="text-gray-800">Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Generate hundreds of profiles in under 60 seconds with our optimized builder.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm mb-6 transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-col items-center text-center">
              <Shield className="w-8 h-8 text-blue-500 mb-3" />
              <CardTitle className="text-gray-800">Advanced AI Jigging</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                3-letter jigs, address variations, and AI powered jigging to avoid detection.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm mb-6 transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-1">
            <CardHeader className="flex flex-col items-center text-center">
              <CreditCard className="w-8 h-8 text-blue-500 mb-3" />
              <CardTitle className="text-gray-800">VCC Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Direct Extend integration for automatic virtual credit card generation.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-lg border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Feature Preview</h2>
                <button
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-gray-600">
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Supported Bots</h3>
                  <p>Make, Valor, Stellar, Hayha, Refract, NSB, ShitBot, Swift, Cyber, Alpine, Shikari</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-2">Profile Features</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Individual profile cards with full editing capability</li>
                    <li>CSV email import with automatic profile generation</li>
                    <li>Advanced AI jigging and randomization</li>
                    <li>Extend VCC integration for virtual credit cards</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  onClick={
                    status === "not-logged"
                      ? () => router.push("/api/oauth/init?next=/builder")
                      : () => router.push(`${process.env.NEXT_WHOP_CHECKOUT_LINK}`)
                  }
                >
                  {status === "not-logged" ? "Login to get started!" : "Start building!"}
                </Button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <PoweredBy className={'absolute'} />
    </div>
  )
}