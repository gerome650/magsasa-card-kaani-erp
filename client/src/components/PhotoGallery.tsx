import { useState } from "react";
import { Image as ImageIcon, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  photos: string[];
  className?: string;
}

export function PhotoGallery({ photos, className }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const openLightbox = (photo: string, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const goToNext = () => {
    const nextIndex = (selectedIndex + 1) % photos.length;
    setSelectedIndex(nextIndex);
    setSelectedPhoto(photos[nextIndex]);
  };

  const goToPrevious = () => {
    const prevIndex = (selectedIndex - 1 + photos.length) % photos.length;
    setSelectedIndex(prevIndex);
    setSelectedPhoto(photos[prevIndex]);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No photos available</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden border border-border group cursor-pointer"
            onClick={() => openLightbox(photo, index)}
          >
            <img
              src={photo}
              alt={`Farm photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Photo {selectedIndex + 1} of {photos.length}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <img
              src={selectedPhoto || ""}
              alt={`Farm photo ${selectedIndex + 1}`}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
            
            {/* Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                >
                  ←
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                >
                  →
                </Button>
              </>
            )}
          </div>
          
          {/* Thumbnail Strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedIndex(index);
                    setSelectedPhoto(photo);
                  }}
                  className={cn(
                    "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors",
                    index === selectedIndex
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground"
                  )}
                >
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
