import { ChangeThemeDialog } from '@/components/ChangeThemeDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wall } from '@/types/database';
import {
  Eye,
  EyeOff,
  MoreVertical,
  Palette,
  Share2,
  Shield,
  Trash2
} from 'lucide-react';
import React, { useState } from 'react';

interface WallManagementProps {
  wall: Wall;
  onWallUpdated?: () => void;
  onWallDeleted?: () => void;
}

export const WallManagement: React.FC<WallManagementProps> = ({
  wall,
  onWallUpdated,
  onWallDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const { toast } = useToast();

  const handleDeleteWall = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('walls')
        .delete()
        .eq('id', wall.id);

      if (error) throw error;

      toast({
        title: "Wall deleted",
        description: "Your wish wall has been permanently deleted.",
      });

      onWallDeleted?.();
    } catch (error) {
      console.error('Error deleting wall:', error);
      toast({
        title: "Error",
        description: "Failed to delete the wall. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleToggleSharing = async () => {
    setIsToggling(true);
    try {
      const { error } = await supabase
        .from('walls')
        .update({ is_active: !wall.is_active })
        .eq('id', wall.id);

      if (error) throw error;

      toast({
        title: wall.is_active ? "Sharing stopped" : "Sharing resumed",
        description: wall.is_active
          ? "Your wall is now private and cannot be accessed by others."
          : "Your wall is now public and can be accessed via the share link.",
      });

      onWallUpdated?.();
    } catch (error) {
      console.error('Error toggling wall sharing:', error);
      toast({
        title: "Error",
        description: "Failed to update sharing settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
      setShowToggleDialog(false);
    }
  };

  const getShareStatusText = () => {
    return wall.is_active ? "Stop Sharing" : "Resume Sharing";
  };

  const getShareStatusIcon = () => {
    return wall.is_active ? <Shield className="h-4 w-4" /> : <Share2 className="h-4 w-4" />;
  };

  const getVisibilityIcon = () => {
    return wall.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="hover-lift">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 card-elevated">
          <DropdownMenuItem onClick={() => setShowThemeDialog(true)}>
            <Palette className="h-4 w-4" />
            <span className="ml-2">Change Theme</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowToggleDialog(true)} disabled={isToggling}>
            {getShareStatusIcon()}
            <span className="ml-2">{getShareStatusText()}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="ml-2">Delete Wall</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Toggle Sharing Dialog */}
      <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {getVisibilityIcon()}
              {wall.is_active ? "Stop Sharing Wall?" : "Resume Sharing Wall?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {wall.is_active ? (
                <>
                  This will make your wall private and revoke access for anyone with the share link.
                  Contributors will no longer be able to view or add memories to this wall.
                </>
              ) : (
                <>
                  This will make your wall public again. Anyone with the share link will be able to
                  view and add memories to this wall.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleSharing}
              disabled={isToggling}
              className={wall.is_active ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {isToggling ? "Updating..." : (wall.is_active ? "Stop Sharing" : "Resume Sharing")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Wall Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete "{wall.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your wish wall and
              all associated memories, comments, and reactions. All contributors will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWall}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Wall"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Theme Dialog */}
      <ChangeThemeDialog
        isOpen={showThemeDialog}
        onOpenChange={setShowThemeDialog}
        wall={wall}
        onThemeChanged={onWallUpdated}
      />
    </>
  );
};
