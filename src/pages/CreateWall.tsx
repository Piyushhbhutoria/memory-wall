import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Palette } from 'lucide-react';
import { wallSchema } from '@/lib/security';
import { Footer } from '@/components/Footer';

const THEME_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b', '#84cc16', '#f59e0b'
];

const CreateWall = () => {
  const [name, setName] = useState('');
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a wall.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Input validation
    try {
      wallSchema.parse({ name });
    } catch (error: any) {
      toast({
        title: "Invalid wall name",
        description: error.errors?.[0]?.message || "Please enter a valid wall name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('walls')
        .insert({
          name,
          theme_color: themeColor,
          host_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Wall created!",
        description: "Your memory wall is ready to share.",
      });

      navigate(`/wall/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to create wall",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create a Memory Wall</CardTitle>
              <CardDescription>
                Set up your digital memory wall for friends and family to share special moments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="wall-name">Wall Name</Label>
                  <Input
                    id="wall-name"
                    type="text"
                    placeholder="Sarah's Graduation Party"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 100))}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme Color
                  </Label>
                  <div className="grid grid-cols-6 gap-3">
                    {THEME_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-12 h-12 rounded-full border-2 transition-all ${
                          themeColor === color 
                            ? 'border-foreground scale-110' 
                            : 'border-muted hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setThemeColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-4">
                    <p>• Always free, unlimited memories</p>
                    <p>• Anyone can contribute with just a link</p>
                    <p>• Share with QR codes or direct links</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Wall'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CreateWall;