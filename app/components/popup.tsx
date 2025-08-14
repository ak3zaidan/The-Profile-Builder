"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw, Loader2 } from "lucide-react"
import { showToast } from "../builder/helper"
import { motion } from "framer-motion"

interface AiJigModalProps {
  endpoint: string
  quantity: number
  address: string
  isOpen: boolean
  onClose: (jigs?: string[]) => void
}

const AiJigModal: React.FC<AiJigModalProps> = ({ endpoint, quantity, address, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [jigs, setJigs] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen) return
    (async () => {
      setLoading(true)
     await fetchJigs()
    })()
  }, [isOpen, endpoint, quantity])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose('close')
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, jigs])

  const handleClose = (type: String) => {
    if(type === 'close'){
      onClose();
      return;
    }
    onClose(jigs)
  }

  const removeJig = (idx: number) => {
    setJigs((prev) => prev.filter((_, i) => i !== idx))
  }

  if (!isOpen) return null

  const fetchJigs = async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: quantity, address: address }),
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data: any = await res.json()
      setJigs(data?.jigs)
    } catch {
      // fallback test addresses
      const testAddresses = [
        "742 Evergreen Terrace, Springfield, USA",
        "221B Baker Street, London, UK",
        "1600 Pennsylvania Ave NW, Washington, DC, USA",
        "350 Fifth Avenue, New York, NY, USA",
        "1 Infinite Loop, Cupertino, CA, USA",
        "10 Downing Street, London, UK",
      ]
      setJigs(testAddresses.slice(0, quantity))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose("close");
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg p-6 w-full max-w-lg border border-gray-200 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              AI Address Generation
            </h2>
          </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-10">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="text-gray-700 font-medium">Generating addresses...</span>
              </div>
            ) : (
              jigs.length > 0 && (
                <div className="space-y-4">
                  <ul className="max-h-64 overflow-auto space-y-2 pr-1">
                    {jigs.map((addr, idx) => (
                      <li
                        key={idx}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      >
                      <span className="flex-1 pr-2 break-all text-gray-700">{addr}</span>
                        <button
                        onClick={() => jigs.length > 1
                          ? removeJig(idx)
                          : showToast({ message: "Cannot delete all generated jigs", type: "error" })
                        }
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>

                <div className="flex justify-end space-x-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={fetchJigs}
                        disabled={loading}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                        >
                    <RefreshCw size={16} className="mr-2" /> Regenerate
                      </Button>
                  <Button
                    onClick={handleClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    Submit
                  </Button>
                  </div>
                </div>
              )
            )}
        </motion.div>
        </div>
    </>
  )
}

export default AiJigModal
