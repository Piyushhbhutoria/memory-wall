import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useWallExport } from '@/hooks/useWallExport';
import { Wall } from '@/types/database';
import { Download, FileImage, FileText } from 'lucide-react';
import React, { useState } from 'react';

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  wall: Wall;
  exportElementId: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onOpenChange,
  wall,
  exportElementId
}) => {
  const [format, setFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');
  const [quality, setQuality] = useState([90]);
  const [isExporting, setIsExporting] = useState(false);
  const { exportWall } = useWallExport();

  const handleExport = async () => {
    const element = document.getElementById(exportElementId);
    if (!element) {
      console.error('Export element not found');
      return;
    }

    setIsExporting(true);
    try {
      await exportWall(element, {
        wallName: wall.name,
        format,
        quality: quality[0] / 100,
      });
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (formatType: string) => {
    switch (formatType) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'png':
      case 'jpeg':
        return <FileImage className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Wall
          </DialogTitle>
          <DialogDescription>
            Export "{wall.name}" as a PDF or image file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF Document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="png" />
                <Label htmlFor="png" className="flex items-center gap-2 cursor-pointer">
                  <FileImage className="h-4 w-4" />
                  PNG Image (transparent background)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jpeg" id="jpeg" />
                <Label htmlFor="jpeg" className="flex items-center gap-2 cursor-pointer">
                  <FileImage className="h-4 w-4" />
                  JPEG Image (white background)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {format !== 'pdf' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Quality: {quality[0]}%
              </Label>
              <Slider
                value={quality}
                onValueChange={setQuality}
                max={100}
                min={10}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher quality produces larger files but better image clarity.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  {getFormatIcon(format)}
                  Export as {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};