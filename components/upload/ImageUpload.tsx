"use client"

import { useState, useCallback, useRef } from "react"
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith("image/")) {
        onImageSelect(file)
      } else {
        alert("Please upload an image file (JPG, PNG, etc.)")
      }
    },
    [onImageSelect]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      console.log("✅ File selected:", file.name, file.type, file.size)
      onImageSelect(file)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } else if (file) {
      alert("Please upload an image file (JPG, PNG, etc.)")
    }
  }

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="w-full">
      {!selectedImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={`border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <div className="flex flex-col items-center justify-center p-12">
            <Upload className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">
              Drag and drop your meal photo here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload-input"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                openFileDialog()
              }}
            >
              Choose File
            </Button>
          </div>
        </div>
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
