import { Suspense, lazy } from 'react';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WallGrid } from '@/components/WallGrid';
import { WallManagement } from '@/components/WallManagement';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Memory, Wall } from '@/types/database';

// Lazy load heavy modal components
const AddMemoryModal = lazy(() => import('@/components/AddMemoryModal').then(m => ({ default: m.AddMemoryModal })));
const ConfirmDialog = lazy(() => import('@/components/ConfirmDialog').then(m => ({ default: m.ConfirmDialog })));

import {
  ArrowLeft,
  Crown,
  Eye,
  EyeOff,
  Plus,
  QrCode,
  Share2,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const WallView = () => {
  const { wallId } = useParams<{ wallId: string }>();
  const [wall, setWall] = useState<Wall | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => { }
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isHost = user && wall && user.id === wall.host_user_id;
  const wallUrl = `${window.location.origin}/wall/${wallId}`;

  const handleWallDeleted = () => {
    navigate('/');
  };

  const handleWallUpdated = () => {
    loadWall(); // Refresh wall data to get updated theme
    loadMemories(); // Refresh memories in case anything changed
  };

  useEffect(() => {
    if (wallId) {
      loadWall();
      loadMemories();
    }
  }, [wallId]);

  const loadWall = async () => {
    try {
      const { data, error } = await supabase
        .from('walls')
        .select('*')
        .eq('id', wallId)
        .single();

      if (error) throw error;
      setWall(data);
    } catch (error: any) {
      toast({
        title: "Wall not found",
        description: "This wall doesn't exist or has been removed.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          reactions (*),
          comments (*)
        `)
        .eq('wall_id', wallId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories((data || []) as Memory[]);
    } catch (error: any) {
      console.error('Error loading memories:', error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: wall?.name,
        text: `Check out ${wall?.name} - a wish wall!`,
        url: wallUrl,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(wallUrl);
      toast({
        title: "Link copied!",
        description: "Wall link has been copied to your clipboard.",
      });
    }
  };

  const generateQRCode = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(wallUrl)}`;
  };

  const getDaysLeft = () => {
    if (!wall) return 0;
    const now = new Date();
    const expiry = new Date(wall.expires_at);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading wall...</p>
        </div>
      </div>
    );
  }

  if (!wall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Wall not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft();
  const memoryCount = memories.length;
  const isNearLimit = memoryCount >= wall.max_memories * 0.8;
  const isExpired = daysLeft === 0 && !wall.is_paid;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div
        className="border-b"
        style={{ backgroundColor: `${wall.theme_color}15` }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>

            <ThemeToggle />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{wall.name}</h1>
                {isHost && (
                  <Badge variant="secondary">
                    <Crown className="mr-1 h-3 w-3" />
                    Host
                  </Badge>
                )}
                {!wall.is_active && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Private
                  </Badge>
                )}
              </div>

              {isHost && (
                <WallManagement
                  wall={wall}
                  onWallDeleted={handleWallDeleted}
                  onWallUpdated={handleWallUpdated}
                />
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{memoryCount} wishes</span>
              </div>

              <div className="flex items-center gap-1">
                {wall.is_active ? (
                  <>
                    <Eye className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Publicly shared</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                    <span>Private (not shared)</span>
                  </>
                )}
              </div>
            </div>

            {!wall.is_active && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <EyeOff className="inline h-4 w-4 mr-1" />
                  This wall is currently private. Only you can see it. Use the management menu to resume sharing.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                style={{ backgroundColor: wall.theme_color }}
                className="text-white hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Wish
              </Button>

              {wall.is_active && (
                <>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Wall
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowQR(!showQR)}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </Button>
                </>
              )}
            </div>

            {showQR && wall.is_active && (
              <Card className="w-fit">
                <CardContent className="p-4 text-center">
                  <img
                    src={generateQRCode()}
                    alt="QR Code"
                    className="mx-auto mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Scan to visit wall
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Memories Grid */}
      <div className="flex-1">
        <div id="wall-export-content" className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: wall.theme_color }}>
              {wall.name}
            </h2>
            <p className="text-muted-foreground">
              {memories.length} {memories.length === 1 ? 'wish' : 'wishes'}
            </p>
          </div>
          
          <WallGrid
            wallId={wallId!}
            memories={memories}
            onMemoryUpdate={loadMemories}
          />
        </div>
      </div>

      {/* Add Memory Modal */}
      <Suspense fallback={<div />}>
        <AddMemoryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          wallId={wallId!}
          onMemoryAdded={() => {
            loadMemories();
            setIsAddModalOpen(false);
          }}
        />
      </Suspense>

      {/* Confirmation Dialog */}
      <Suspense fallback={<div />}>
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={() => {
            confirmDialog.action();
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant="destructive"
          confirmText="Delete"
        />
      </Suspense>

      <Footer />
    </div>
  );
};

export default WallView;
