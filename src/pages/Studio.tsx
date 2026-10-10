import { useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Camera, SwitchCamera, Upload, Sparkles, ImagePlus, Video,
  Music, Wand2, Download, Loader2, X, Film, Palette, Sun, Contrast,
  Aperture, Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import studioHero from '@/assets/studio-hero.jpg';
import musicStudio from '@/assets/music-studio.jpg';
import editingStudio from '@/assets/editing-studio.jpg';

type StudioImage = {
  id: string;
  src: string;
  enhanced?: string;
  name: string;
};

const Studio = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<StudioImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<StudioImage | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [streaming, setStreaming] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Filters
  const filters = [
    { name: 'Original', css: 'none' },
    { name: 'Warm', css: 'sepia(0.3) saturate(1.4) brightness(1.1)' },
    { name: 'Cool', css: 'saturate(0.8) hue-rotate(20deg) brightness(1.05)' },
    { name: 'B&W', css: 'grayscale(1) contrast(1.2)' },
    { name: 'Vivid', css: 'saturate(1.8) contrast(1.15)' },
    { name: 'Cinema', css: 'contrast(1.3) brightness(0.9) saturate(1.2)' },
    { name: 'Fade', css: 'brightness(1.15) contrast(0.85) saturate(0.8)' },
    { name: 'Dramatic', css: 'contrast(1.5) brightness(0.85) saturate(1.3)' },
  ];
  const [activeFilter, setActiveFilter] = useState('none');

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStreaming(true);
    } catch {
      toast.error('Camera access denied');
      setStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStreaming(false);
    setShowCamera(false);
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const newImg: StudioImage = { id: crypto.randomUUID(), src: dataUrl, name: `Photo_${Date.now()}.jpg` };
    setImages(prev => [newImg, ...prev]);
    setSelectedImage(newImg);
    toast.success('📸 Photo captured!');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newImg: StudioImage = { id: crypto.randomUUID(), src: reader.result as string, name: file.name };
        setImages(prev => [newImg, ...prev]);
        setSelectedImage(newImg);
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} image(s) uploaded`);
  };

  const enhanceWithAI = async () => {
    if (!selectedImage) return;
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: { imageUrl: selectedImage.src, prompt: 'Enhance this photo: improve lighting, smooth skin, sharpen details, make it look professional studio quality' },
      });
      if (error) throw error;
      if (data?.enhancedUrl) {
        setImages(prev => prev.map(img => img.id === selectedImage.id ? { ...img, enhanced: data.enhancedUrl } : img));
        setSelectedImage(prev => prev ? { ...prev, enhanced: data.enhancedUrl } : null);
        toast.success('✨ Photo enhanced with AI!');
      }
    } catch {
      toast.error('Enhancement service coming soon');
    } finally {
      setEnhancing(false);
    }
  };

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-studio-image', {
        body: { prompt: aiPrompt },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        const newImg: StudioImage = { id: crypto.randomUUID(), src: data.imageUrl, name: `AI_${Date.now()}.png` };
        setImages(prev => [newImg, ...prev]);
        setSelectedImage(newImg);
        toast.success('🎨 AI image generated!');
      }
    } catch {
      toast.error('AI generation coming soon');
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!selectedImage) return;
    const link = document.createElement('a');
    link.href = selectedImage.enhanced || selectedImage.src;
    link.download = selectedImage.name;
    link.click();
    toast.success('Image downloaded');
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Hero */}
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img src={studioHero} alt="WorldFace Studio" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
            <h1 className="text-2xl md:text-4xl font-bold font-heading bg-gradient-to-r from-amber-300 via-rose-400 to-violet-400 bg-clip-text text-transparent">
              WorldFace Studio
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Photo • Video • Music • AI</p>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
          <Tabs defaultValue="photo" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur">
              <TabsTrigger value="photo" className="gap-1.5 text-xs md:text-sm">
                <Camera className="w-4 h-4" /> Photo
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-1.5 text-xs md:text-sm">
                <Video className="w-4 h-4" /> Video
              </TabsTrigger>
              <TabsTrigger value="music" className="gap-1.5 text-xs md:text-sm">
                <Music className="w-4 h-4" /> Music
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-1.5 text-xs md:text-sm">
                <Wand2 className="w-4 h-4" /> AI Art
              </TabsTrigger>
            </TabsList>

            {/* ===== PHOTO STUDIO ===== */}
            <TabsContent value="photo" className="space-y-4 mt-4">
              {/* Camera / Upload Actions */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    className="w-full h-20 bg-gradient-to-br from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold rounded-2xl flex flex-col gap-1"
                    onClick={() => { setShowCamera(true); startCamera(facingMode); }}
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs">Open Camera</span>
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    className="w-full h-20 rounded-2xl flex flex-col gap-1 border-dashed border-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Upload Photos</span>
                  </Button>
                </motion.div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
              </div>

              {/* Live Camera */}
              {showCamera && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="overflow-hidden rounded-2xl border-2 border-primary/30">
                    <div className="relative bg-black aspect-[4/3]">
                      <video
                        ref={videoRef}
                        autoPlay playsInline muted
                        className="w-full h-full object-cover"
                        style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : undefined}
                      />
                      {!streaming && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    {streaming && (
                      <div className="flex items-center justify-center gap-4 p-4 bg-card">
                        <Button variant="outline" size="icon" className="rounded-full" onClick={() => {
                          const next = facingMode === 'user' ? 'environment' : 'user';
                          setFacingMode(next);
                          startCamera(next);
                        }}>
                          <SwitchCamera className="h-5 w-5" />
                        </Button>
                        <Button
                          size="lg"
                          className="rounded-full h-16 w-16 p-0 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 shadow-lg"
                          onClick={capturePhoto}
                        >
                          <Aperture className="w-8 h-8 text-white" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full" onClick={stopCamera}>
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Selected Image Editor */}
              {selectedImage && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="overflow-hidden rounded-2xl">
                    <div className="relative bg-black">
                      <img
                        src={selectedImage.enhanced || selectedImage.src}
                        alt={selectedImage.name}
                        className="w-full max-h-[400px] object-contain"
                        style={{ filter: activeFilter }}
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      {/* Filters */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {filters.map(f => (
                          <button
                            key={f.name}
                            className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-all ${
                              activeFilter === f.css
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-accent'
                            }`}
                            onClick={() => setActiveFilter(f.css)}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={enhanceWithAI} disabled={enhancing}
                          className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                          {enhancing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                          AI Enhance
                        </Button>
                        <Button size="sm" variant="outline" onClick={downloadImage}>
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Gallery */}
              {images.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Your Photos</h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {images.map(img => (
                      <motion.div key={img.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <img
                          src={img.enhanced || img.src}
                          alt={img.name}
                          className={`w-full aspect-square object-cover rounded-xl cursor-pointer border-2 transition-all ${
                            selectedImage?.id === img.id ? 'border-primary shadow-lg' : 'border-transparent'
                          }`}
                          onClick={() => setSelectedImage(img)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {images.length === 0 && !showCamera && (
                <div className="text-center py-12 space-y-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 flex items-center justify-center mx-auto">
                    <ImagePlus className="w-10 h-10 text-rose-400" />
                  </div>
                  <p className="text-muted-foreground">Capture or upload your first photo</p>
                </div>
              )}
            </TabsContent>

            {/* ===== VIDEO STUDIO ===== */}
            <TabsContent value="video" className="space-y-4 mt-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden rounded-2xl">
                  <div className="relative">
                    <img src={editingStudio} alt="Video Editing Suite" className="w-full h-48 object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <h3 className="font-heading font-bold text-lg">Video Editing Suite</h3>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Professional shooting & editing tools for content creators. Trim, cut, add effects, transitions, and export in stunning quality.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Film, label: 'Record Video', desc: 'HD & 4K capture', color: 'from-cyan-500 to-blue-600' },
                        { icon: Palette, label: 'Color Grade', desc: 'Cinema LUTs', color: 'from-amber-500 to-orange-600' },
                        { icon: Zap, label: 'Quick Edit', desc: 'Trim & merge', color: 'from-emerald-500 to-green-600' },
                        { icon: Sparkles, label: 'AI Effects', desc: 'Smart enhance', color: 'from-violet-500 to-purple-600' },
                      ].map((tool) => (
                        <motion.div key={tool.label} whileTap={{ scale: 0.95 }}>
                          <Card className={`bg-gradient-to-br ${tool.color} border-0 cursor-pointer rounded-xl`}
                            onClick={() => toast.info(`${tool.label} — Coming soon!`)}>
                            <CardContent className="p-4 text-white text-center">
                              <tool.icon className="w-8 h-8 mx-auto mb-2" />
                              <p className="font-bold text-sm">{tool.label}</p>
                              <p className="text-[11px] text-white/70">{tool.desc}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ===== MUSIC VIDEO STUDIO ===== */}
            <TabsContent value="music" className="space-y-4 mt-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden rounded-2xl">
                  <div className="relative">
                    <img src={musicStudio} alt="Music Video Studio" className="w-full h-48 object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <h3 className="font-heading font-bold text-lg">Music Video Studio</h3>
                      <p className="text-xs text-muted-foreground">Beat gear • Pro lighting • Award-winning quality</p>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create beautiful, award-winning music videos with professional beat gear, dramatic lighting setups, and cinematic effects.
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: '🎤', label: 'Record' },
                        { icon: '🎬', label: 'Shoot MV' },
                        { icon: '🎛️', label: 'Beat Studio' },
                        { icon: '💡', label: 'Lighting FX' },
                        { icon: '🎞️', label: 'Transitions' },
                        { icon: '🏆', label: 'Export HD' },
                      ].map((item) => (
                        <motion.div key={item.label} whileTap={{ scale: 0.95 }}>
                          <Button variant="outline" className="w-full h-16 flex flex-col gap-1 rounded-xl"
                            onClick={() => toast.info(`${item.label} — Coming soon!`)}>
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-[10px]">{item.label}</span>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ===== AI ART GENERATOR ===== */}
            <TabsContent value="ai" className="space-y-4 mt-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-card via-card to-violet-500/5 border-violet-500/20 rounded-2xl">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wand2 className="w-6 h-6 text-violet-400" />
                      <h3 className="font-heading font-bold text-lg">AI Image Generator</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Describe any image and our AI will create it — portraits, landscapes, album covers, music video concepts, and more.
                    </p>
                    <Textarea
                      placeholder="Describe your image... e.g. 'A futuristic city with neon lights reflecting on wet streets at night, cinematic lighting'"
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      className="min-h-[80px] bg-background/50"
                    />
                    <div className="flex gap-2 flex-wrap text-xs">
                      {['Portrait photo', 'Album cover', 'Music video scene', 'Product shot', 'Abstract art'].map(tag => (
                        <button key={tag}
                          className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors"
                          onClick={() => setAiPrompt(prev => prev ? `${prev}, ${tag.toLowerCase()}` : tag)}>
                          {tag}
                        </button>
                      ))}
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold"
                      onClick={generateAIImage}
                      disabled={generating || !aiPrompt.trim()}
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate Image
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Gallery */}
              {images.filter(img => img.name.startsWith('AI_')).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">AI Creations</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {images.filter(img => img.name.startsWith('AI_')).map(img => (
                      <motion.div key={img.id} whileHover={{ scale: 1.03 }}>
                        <img
                          src={img.src}
                          alt={img.name}
                          className="w-full aspect-square object-cover rounded-xl cursor-pointer border border-border hover:border-violet-500 transition-all"
                          onClick={() => setSelectedImage(img)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Studio;
