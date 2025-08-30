import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFingerprint } from '@/hooks/useFingerprint';
import { supabase } from '@/integrations/supabase/client';
import { memoryContentSchema, rateLimiter, validateFile } from '@/lib/security';
import { Camera, Palette, Type, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallId: string;
  onMemoryAdded: () => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  isOpen,
  onClose,
  wallId,
  onMemoryAdded,
}) => {
  const [authorName, setAuthorName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const fingerprint = useFingerprint();
  const { toast } = useToast();

  const resetForm = () => {
    setAuthorName('');
    setTextContent('');
    setUploadedFile(null);
    setActiveTab('text');
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${wallId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('wall-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('wall-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const saveSketch = async (): Promise<string | null> => {
    if (!canvasRef.current) return null;

    return new Promise((resolve) => {
      canvasRef.current!.toBlob(async (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        try {
          const file = new File([blob], 'sketch.png', { type: 'image/png' });
          const url = await uploadFile(file);
          resolve(url);
        } catch (error) {
          resolve(null);
        }
      });
    });
  };

  const handleSubmit = async () => {
    // Rate limiting check
    if (!rateLimiter.isAllowed(fingerprint || 'anonymous', 'memory_creation')) {
      toast({
        title: "Too many requests",
        description: "Please wait before adding another wish",
        variant: "destructive"
      });
      return;
    }

    // Input validation
    try {
      const validationData = {
        content: textContent,
        authorName: authorName.trim(),
        type: activeTab as 'text' | 'image' | 'video' | 'sketch'
      };

      memoryContentSchema.parse(validationData);
    } catch (error: any) {
      toast({
        title: "Invalid input",
        description: error.errors?.[0]?.message || "Please check your input",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let memoryData: any = {
        wall_id: wallId,
        author_name: authorName.trim(),
        author_fingerprint: fingerprint,
      };

      if (activeTab === 'text') {
        if (!textContent.trim()) {
          toast({
            title: "Content required",
            description: "Please enter some text.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        memoryData.type = 'text';
        memoryData.content = textContent.trim();
      } else if (activeTab === 'upload' && uploadedFile) {
        const mediaUrl = await uploadFile(uploadedFile);
        memoryData.type = uploadedFile.type.startsWith('video/') ? 'video' :
          uploadedFile.type === 'image/gif' ? 'gif' : 'image';
        memoryData.media_url = mediaUrl;
        memoryData.media_type = uploadedFile.type;
        if (textContent.trim()) {
          memoryData.content = textContent.trim();
        }
      } else if (activeTab === 'sketch') {
        const sketchUrl = await saveSketch();
        if (!sketchUrl) {
          toast({
            title: "Sketch required",
            description: "Please draw something first.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        memoryData.type = 'sketch';
        memoryData.media_url = sketchUrl;
        if (textContent.trim()) {
          memoryData.content = textContent.trim();
        }
      }

      const { error } = await supabase
        .from('memories')
        .insert(memoryData);

      if (error) throw error;

      toast({
        title: "Wish added!",
        description: "Your wish has been shared on the wall.",
      });

      resetForm();
      onMemoryAdded();
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to add wish",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Canvas drawing functionality
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Initialize canvas
  React.useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Share a Wish</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="author-name">Your Name</Label>
            <Input
              id="author-name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value.slice(0, 50))}
              placeholder="Enter your name"
              maxLength={50}
              required
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="sketch" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Sketch
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div>
                <Label htmlFor="text-content">Message</Label>
                <Textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value.slice(0, 2000))}
                  placeholder="Share your thoughts, memories, or well-wishes..."
                  className="min-h-[120px]"
                  maxLength={2000}
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div>
                <Label>Upload Photo, GIF, or Video</Label>
                <Card className="border-dashed border-2 p-6">
                  <div className="text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,.gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    {uploadedFile && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Selected: {uploadedFile.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Max file size: 20MB
                    </p>
                  </div>
                </Card>
              </div>
              <div>
                <Label htmlFor="upload-caption">Caption (optional)</Label>
                <Textarea
                  id="upload-caption"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Add a caption to your media..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="sketch" className="space-y-4">
              <div>
                <Label>Draw Something</Label>
                <Card className="p-4">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={300}
                    className="border border-muted rounded w-full cursor-crosshair bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const ctx = canvasRef.current?.getContext('2d');
                      if (ctx && canvasRef.current) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                      }
                    }}
                  >
                    Clear Canvas
                  </Button>
                </Card>
              </div>
              <div>
                <Label htmlFor="sketch-caption">Caption (optional)</Label>
                <Textarea
                  id="sketch-caption"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Describe your drawing..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading ? 'Sharing...' : 'Share Wish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
