import React, { useState, useCallback } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export default function ImageCropper({ image, onCropComplete, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleDone = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        onCropComplete(croppedImage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black flex flex-col font-alinur"
      style={{ fontFamily: 'Alinur Tatsama' }}
    >
      <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-md z-10 text-white border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-black">ছবি ক্রপ করুন</h3>
        </div>
        <button
          onClick={handleDone}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-black transition-all active:scale-95"
        >
          <Check className="w-5 h-5" />
          সম্পন্ন
        </button>
      </div>

      <div className="relative flex-1 bg-neutral-900">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onCropComplete={onCropAreaComplete}
          onZoomChange={onZoomChange}
        />
      </div>

      <div className="p-8 bg-black/80 backdrop-blur-md z-10 space-y-6">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <ZoomOut className="w-5 h-5 text-white/50" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="flex-1 accent-emerald-500 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
          <ZoomIn className="w-5 h-5 text-white/50" />
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); }}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            রিসেট করুন
          </button>
        </div>
      </div>
    </motion.div>
  );
}
