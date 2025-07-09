import React, { useState, useEffect } from 'react';
import { Memory } from '@/types/database';
import { MemoryCard } from './MemoryCard';
import { supabase } from '@/integrations/supabase/client';

interface WallGridProps {
  wallId: string;
  memories: Memory[];
  onMemoryUpdate: () => void;
}

export const WallGrid: React.FC<WallGridProps> = ({ wallId, memories, onMemoryUpdate }) => {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Set up realtime subscription for memories
  useEffect(() => {
    const channel = supabase
      .channel('wall-memories')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memories',
          filter: `wall_id=eq.${wallId}`
        },
        () => {
          onMemoryUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions'
        },
        () => {
          onMemoryUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        () => {
          onMemoryUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wallId, onMemoryUpdate]);

  const openMemory = (memory: Memory) => {
    setSelectedMemory(memory);
  };

  const closeMemory = () => {
    setSelectedMemory(null);
  };

  return (
    <>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {memories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            onClick={() => openMemory(memory)}
            className="break-inside-avoid mb-4"
          />
        ))}
      </div>

      {memories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No memories yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Be the first to share a memory!
          </p>
        </div>
      )}

      {selectedMemory && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeMemory}
        >
          <div 
            className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <MemoryCard 
              memory={selectedMemory} 
              isExpanded={true}
              onClose={closeMemory}
            />
          </div>
        </div>
      )}
    </>
  );
};