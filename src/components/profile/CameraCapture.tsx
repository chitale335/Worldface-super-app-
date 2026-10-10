import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, SwitchCamera, X } from 'lucide-react';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export const CameraCapture = ({ open, onOpenChange, onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [streaming, setStreaming] = useState(false);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreaming(true);
    } catch {
      setStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const switchCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    startCamera(next);
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        stopCamera();
        onOpenChange(false);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) stopCamera();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-sm p-4">
        <DialogHeader>
          <DialogTitle className="text-base">Take Profile Photo</DialogTitle>
        </DialogHeader>

        <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : undefined}
          />
          {!streaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button onClick={() => startCamera(facingMode)}>
                <Camera className="mr-2 h-4 w-4" /> Open Camera
              </Button>
            </div>
          )}
        </div>

        {streaming && (
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={switchCamera}>
              <SwitchCamera className="h-5 w-5" />
            </Button>
            <Button size="lg" onClick={capture} className="rounded-full h-14 w-14 p-0">
              <div className="h-10 w-10 rounded-full border-4 border-primary-foreground" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => { stopCamera(); onOpenChange(false); }}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
