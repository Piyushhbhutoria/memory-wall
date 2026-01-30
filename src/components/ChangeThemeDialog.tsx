import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wall } from '@/types/database';
import { Palette, Check } from 'lucide-react';

const THEME_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b', '#84cc16', '#f59e0b'
];

interface ChangeThemeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  wall: Wall;
  onThemeChanged?: () => void;
}

export const ChangeThemeDialog: React.FC<ChangeThemeDialogProps> = ({
  isOpen,
  onOpenChange,
  wall,
  onThemeChanged
}) => {
  const [selectedColor, setSelectedColor] = useState(wall.theme_color || '#6366f1');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdateTheme = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('walls')
        .update({ theme_color: selectedColor })
        .eq('id', wall.id);

      if (error) throw error;

      toast({
        title: "Theme updated",
        description: "Your wall's theme color has been changed.",
      });

      onThemeChanged?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({
        title: "Error",
        description: "Failed to update theme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset selected color when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedColor(wall.theme_color || '#6366f1');
    }
  }, [isOpen, wall.theme_color]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Change Wall Theme
          </DialogTitle>
          <DialogDescription>
            Choose a new color theme for "{wall.name}". This will update the appearance throughout the wall.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current vs New Preview */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center space-y-2">
              <Label className="text-sm text-muted-foreground">Current</Label>
              <div 
                className="w-full h-8 rounded-md border"
                style={{ backgroundColor: wall.theme_color }}
              />
            </div>
            <div className="text-center space-y-2">
              <Label className="text-sm text-muted-foreground">New</Label>
              <div 
                className="w-full h-8 rounded-md border"
                style={{ backgroundColor: selectedColor }}
              />
            </div>
          </div>

          {/* Color Selection Grid */}
          <div className="space-y-3">
            <Label>Select Theme Color</Label>
            <div className="grid grid-cols-6 gap-3">
              {THEME_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-300 relative hover:scale-110 ${
                    selectedColor === color 
                      ? 'border-primary ring-2 ring-ring ring-offset-2' 
                      : 'border-border hover:border-primary/30'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="gradient"
              onClick={handleUpdateTheme}
              disabled={isUpdating || selectedColor === wall.theme_color}
            >
              {isUpdating ? 'Updating...' : 'Update Theme'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};