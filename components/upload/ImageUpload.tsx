"use client"

import { useState, useCallback } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  selectedImage: File | null
  onRemove: () => void
}

export default function ImageUpload({
  onImageSelect,
  selectedImage,
  onRemove,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        onImageSelect(file)
      }
    },
    [onImageSelect]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      onImageSelect(file)
    }
  }

  return (
    <div className="w-full">
      {!selectedImage ? (
        <Card
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Upload className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">
              Drag and drop your meal photo here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button type="button" variant="outline" asChild>
                <span>Choose File</span>
              </Button>
            </label>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Selected meal"
                className="w-full h-auto rounded-lg max-h-96 object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={onRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>{selectedImage.name}</span>
              <span className="text-xs">
                ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

