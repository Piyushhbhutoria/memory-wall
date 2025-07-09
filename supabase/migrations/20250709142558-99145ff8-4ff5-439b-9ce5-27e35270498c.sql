-- Create walls table
CREATE TABLE public.walls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  theme_color TEXT DEFAULT '#6366f1',
  cover_photo_url TEXT,
  host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  is_paid BOOLEAN DEFAULT FALSE,
  max_memories INTEGER DEFAULT 200,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create memories table
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wall_id UUID NOT NULL REFERENCES public.walls(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'sketch', 'image', 'gif', 'video')),
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  author_name TEXT DEFAULT 'Anonymous',
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
  UNIQUE(memory_id, author_fingerprint, emoji)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT DEFAULT 'Anonymous',
  author_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.walls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for walls
CREATE POLICY "Walls are viewable by everyone" ON public.walls FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create walls" ON public.walls FOR INSERT WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "Users can update their own walls" ON public.walls FOR UPDATE USING (auth.uid() = host_user_id);

-- RLS Policies for memories
CREATE POLICY "Memories are viewable by everyone" ON public.memories FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.walls WHERE walls.id = memories.wall_id AND walls.is_active = true)
);
CREATE POLICY "Anyone can create memories" ON public.memories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.walls WHERE walls.id = memories.wall_id AND walls.is_active = true)
);
CREATE POLICY "Wall hosts can delete memories" ON public.memories FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.walls WHERE walls.id = memories.wall_id AND walls.host_user_id = auth.uid())
);

-- RLS Policies for reactions
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Anyone can create reactions" ON public.reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own reactions" ON public.reactions FOR DELETE USING (author_fingerprint = current_setting('request.jwt.claims', true)::json->>'fingerprint');

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Wall hosts can delete comments" ON public.comments FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.memories m 
    JOIN public.walls w ON w.id = m.wall_id 
    WHERE m.id = comments.memory_id AND w.host_user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON public.memories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('wall-media', 'wall-media', true);

-- Storage policies for wall media
CREATE POLICY "Wall media is publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'wall-media');
CREATE POLICY "Anyone can upload wall media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'wall-media');
CREATE POLICY "Wall hosts can delete wall media" ON storage.objects FOR DELETE USING (bucket_id = 'wall-media');

-- Enable realtime for tables
ALTER TABLE public.walls REPLICA IDENTITY FULL;
ALTER TABLE public.memories REPLICA IDENTITY FULL;
ALTER TABLE public.reactions REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.walls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;