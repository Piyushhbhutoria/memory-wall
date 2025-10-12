-- Create walls table
CREATE TABLE public.walls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  theme_color TEXT NOT NULL DEFAULT '#8B5CF6',
  cover_photo_url TEXT,
  host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  is_paid BOOLEAN NOT NULL DEFAULT false,
  max_memories INTEGER NOT NULL DEFAULT 200,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create memories table
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wall_id UUID NOT NULL REFERENCES public.walls(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'sketch', 'image', 'gif', 'video')),
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  author_name TEXT NOT NULL,
  author_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reactions table
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  author_fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(memory_id, author_fingerprint)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Walls RLS Policies
CREATE POLICY "Anyone can view active walls"
  ON public.walls FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create walls"
  ON public.walls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Wall hosts can update their walls"
  ON public.walls FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_user_id);

CREATE POLICY "Wall hosts can delete their walls"
  ON public.walls FOR DELETE
  TO authenticated
  USING (auth.uid() = host_user_id);

-- Memories RLS Policies
CREATE POLICY "Anyone can view memories"
  ON public.memories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create memories"
  ON public.memories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Wall hosts can delete memories"
  ON public.memories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.walls
      WHERE walls.id = memories.wall_id
      AND walls.host_user_id = auth.uid()
    )
  );

-- Reactions RLS Policies
CREATE POLICY "Anyone can view reactions"
  ON public.reactions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own reactions"
  ON public.reactions FOR DELETE
  USING (true);

-- Comments RLS Policies
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Wall hosts can delete comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memories
      JOIN public.walls ON walls.id = memories.wall_id
      WHERE memories.id = comments.memory_id
      AND walls.host_user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger for memories
CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for wall media
INSERT INTO storage.buckets (id, name, public)
VALUES ('wall-media', 'wall-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for wall-media bucket
CREATE POLICY "Anyone can view wall media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'wall-media');

CREATE POLICY "Authenticated users can upload wall media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wall-media');

CREATE POLICY "Users can update their uploaded media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'wall-media');

CREATE POLICY "Users can delete their uploaded media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'wall-media');

-- Add indexes for better performance
CREATE INDEX idx_memories_wall_id ON public.memories(wall_id);
CREATE INDEX idx_reactions_memory_id ON public.reactions(memory_id);
CREATE INDEX idx_comments_memory_id ON public.comments(memory_id);
CREATE INDEX idx_walls_host_user_id ON public.walls(host_user_id);
CREATE INDEX idx_walls_expires_at ON public.walls(expires_at);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.walls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;