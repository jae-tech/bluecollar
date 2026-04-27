"use client";

import { useRef } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

interface Step4Props {
  images: File[];
  onImagesSelect: (images: File[]) => void;
  onSkip: () => void;
}

export function Step4Portfolio({ images, onImagesSelect, onSkip }: Step4Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onImagesSelect([...images, ...files]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onImagesSelect([...images, ...files]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Title & Subtitle */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          실력을 증명할 작업 사진이 있나요?
        </h1>
        <p className="text-base text-muted-foreground">
          완성된 프로젝트의 사진을 추가해주세요.
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
            <p className="font-semibold text-foreground">사진 추가</p>
            <p className="text-sm text-muted-foreground">
              잘 찍힌 사진이나 완성도 높은 작업 사진을 추천합니다.
            </p>
          </div>
        </div>

        {/* Uploaded Images */}
        {images.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">{`추가된 사진 (${images.length})`}</p>
            <div className="grid grid-cols-2 gap-3">
              {images.map((file, idx) => (
                <div
                  key={idx}
                  className="relative rounded-xl overflow-hidden bg-secondary aspect-square flex items-center justify-center"
                >
                  <ImageIcon size={32} className="text-muted-foreground" />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {file.name}
                  </p>
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
          나중에 등록하기
        </button>
      </div>
    </div>
  );
}
