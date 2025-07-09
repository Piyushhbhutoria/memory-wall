import React, { useState } from 'react';
import { Memory } from '@/types/database';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, X } from 'lucide-react';
import { useFingerprint } from '@/hooks/useFingerprint';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MemoryCardProps {
  memory: Memory;
  onClick?: () => void;
  className?: string;
  isExpanded?: boolean;
  onClose?: () => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ 
  memory, 
  onClick, 
  className = '',
  isExpanded = false,
  onClose 
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const fingerprint = useFingerprint();
  const { toast } = useToast();

  const handleReaction = async (emoji: string) => {
    if (!fingerprint) return;

    try {
      const { error } = await supabase
        .from('reactions')
        .upsert({
          memory_id: memory.id,
          emoji,
          author_fingerprint: fingerprint,
        });

      if (error) throw error;
      setIsLiked(!isLiked);
    } catch (error: any) {
      toast({
        title: "Failed to add reaction",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderContent = () => {
    switch (memory.type) {
      case 'text':
        return (
          <div className="p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {memory.content}
            </p>
          </div>
        );
      
      case 'image':
      case 'gif':
        return (
          <div className="relative">
            <img 
              src={memory.media_url} 
              alt="Memory"
              className="w-full rounded-lg object-cover"
              loading="lazy"
            />
            {memory.content && (
              <div className="p-4">
                <p className="text-sm">{memory.content}</p>
              </div>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="relative">
            <video 
              src={memory.media_url}
              controls
              className="w-full rounded-lg"
              preload="metadata"
            />
            {memory.content && (
              <div className="p-4">
                <p className="text-sm">{memory.content}</p>
              </div>
            )}
          </div>
        );
      
      case 'sketch':
        return (
          <div className="relative">
            <img 
              src={memory.media_url} 
              alt="Sketch"
              className="w-full rounded-lg bg-white"
              loading="lazy"
            />
            {memory.content && (
              <div className="p-4">
                <p className="text-sm">{memory.content}</p>
              </div>
            )}
          </div>
        );
      
      default:
        return <div className="p-4 text-muted-foreground">Unknown memory type</div>;
    }
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${className}`}
      onClick={!isExpanded ? onClick : undefined}
    >
      {isExpanded && onClose && (
        <div className="flex justify-between items-center p-4 border-b">
          <Badge variant="secondary">{memory.type}</Badge>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <CardContent className="p-0">
        {renderContent()}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between p-4 text-xs text-muted-foreground">
        <div>
          <p className="font-medium">{memory.author_name}</p>
          <p>{formatDate(memory.created_at)}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleReaction('❤️');
            }}
            className={`h-8 px-2 ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="ml-1">{memory.reactions?.length || 0}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className="h-8 px-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="ml-1">{memory.comments?.length || 0}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};