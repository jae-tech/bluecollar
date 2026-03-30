"use client"

import { useRef } from "react"
import { Upload, Image as ImageIcon } from "lucide-react"

interface Step4Props {
  images: File[]
  onImagesSelect: (images: File[]) => void
  onSkip: () => void
}

export function Step4Portfolio({ images, onImagesSelect, onSkip }: Step4Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onImagesSelect([...images, ...files])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    onImagesSelect([...images, ...files])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Title & Subtitle */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {"\uC2E4\uB825\uC744 \uC99D\uBA85\uD560 \uC791\uC5C5 \uC0AC\uC9C4\uC774 \uC788\uB098\uC694?"}
        </h1>
        <p className="text-base text-muted-foreground">
          {"\uC644\uC131\uB41C \uD504\uB85C\uC81D\uD2B8\uC758 \uC0AC\uC9C4\uC744 \uCD94\uAC00\uD574\uC8FC\uC138\uC694."}
        </p>
      </div>

      {/* Dropzone & Uploaded Images */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-8 rounded-2xl border-2 border-dashed border-border bg-secondary cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-3 mb-6"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload size={24} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">{"\uC0AC\uC9C4 \uCD94\uAC00"}</p>
            <p className="text-sm text-muted-foreground">{"\uC729 \uB060\uB978 \uC811\uC774\uB098 \uCEEC\uB9C1 \uC911 \uACE0\uB978 \uC0AC\uC9C4\uB97C \uCD94\uCC9C\uD569\uB2C8\uB2E4."}</p>
          </div>
        </div>

        {/* Uploaded Images */}
        {images.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{`\uCD94\uAC00\uB41C \uC0AC\uC9C4 (${images.length})`}</p>
            <div className="grid grid-cols-2 gap-3">
              {images.map((file, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden bg-secondary aspect-square flex items-center justify-center">
                  <ImageIcon size={32} className="text-muted-foreground" />
                  <p className="text-xs text-gray-500 mt-2 text-center">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Skip Button */}
      <div className="px-6 py-4 border-t border-border">
        <button
          onClick={onSkip}
          className="w-full py-3 rounded-xl border border-border text-muted-foreground font-semibold hover:bg-secondary transition-colors"
        >
          {"\uB098\uC911\uC5D0 \uB4F1\uB85D\uD558\uAE30"}
        </button>
      </div>
    </div>
  )
}
