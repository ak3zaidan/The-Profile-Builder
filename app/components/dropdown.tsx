"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Option {
  value: string
  label: string
  disabled?: boolean
  endLabel?: string
}

interface LabeledSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}

export default function LabeledSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
}: LabeledSelectProps) {
  return (
    <div className={className}>
      <Label className="text-gray-700 text-base" htmlFor={`select-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={`select-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className="bg-gray-50 border-gray-300 text-gray-800 hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/25 focus-visible:border-blue-600 text-base transition-all duration-200"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200 shadow-sm max-h-none">
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-gray-800 hover:bg-gray-50 text-base focus:bg-blue-50 focus:text-blue-600"
              disabled={opt.disabled}
            >
              <div className="flex items-center justify-between">
                {opt.label}
                {opt.endLabel && (
                  <span className="ml-2">{opt.endLabel}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
