import React, { useState, useEffect } from 'react';
import { Memory } from '@/types/database';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, X } from 'lucide-react';
import { useFingerprint } from '@/hooks/useFingerprint';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeContent, rateLimiter } from '@/lib/security';

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

  useEffect(() => {
    // Check if current user has liked this memory
    const checkIfLiked = async () => {
      if (!fingerprint) return;
      
      try {
        const { data, error } = await supabase
          .from('reactions')
          .select('id')
          .eq('memory_id', memory.id)
          .eq('author_fingerprint', fingerprint)
          .eq('emoji', '❤️')
          .single();

        if (data && !error) {
          setIsLiked(true);
        }
      } catch (error) {
        // User hasn't liked this memory yet
        setIsLiked(false);
      }
    };

    checkIfLiked();
  }, [memory.id, fingerprint]);

  const handleReaction = async (emoji: string) => {
    if (!fingerprint) return;

    // Rate limiting check
    if (!rateLimiter.isAllowed(fingerprint)) {
      toast({
        title: "Too many requests",
        description: "Please wait before reacting again",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isLiked) {
        // Remove the like
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('memory_id', memory.id)
          .eq('author_fingerprint', fingerprint)
          .eq('emoji', emoji);

        if (error) throw error;
        setIsLiked(false);
      } else {
        // Add the like
        const { error } = await supabase
          .from('reactions')
          .insert({
            memory_id: memory.id,
            emoji,
            author_fingerprint: fingerprint,
          });

        if (error) throw error;
        setIsLiked(true);
      }
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
            <div 
              className="text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: sanitizeContent(memory.content || '') 
              }}
            />
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
                <div 
                  className="text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeContent(memory.content || '') 
                  }}
                />
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
                <div 
                  className="text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeContent(memory.content || '') 
                  }}
                />
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
              className="w-full rounded-lg bg-card"
              loading="lazy"
            />
            {memory.content && (
              <div className="p-4">
                <div 
                  className="text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeContent(memory.content || '') 
                  }}
                />
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
            className={`h-8 px-2 ${isLiked ? 'text-destructive' : ''}`}
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