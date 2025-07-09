import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/theme-toggle';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Wall } from '@/types/database';
import { 
  Plus, 
  Users, 
  Calendar, 
  Heart,
  Sparkles,
  ArrowRight,
  Gift
} from 'lucide-react';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const [userWalls, setUserWalls] = useState<Wall[]>([]);
  const [isLoadingWalls, setIsLoadingWalls] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadUserWalls();
    }
  }, [user]);

  const loadUserWalls = async () => {
    if (!user) return;
    
    setIsLoadingWalls(true);
    try {
      const { data, error } = await supabase
        .from('walls')
        .select('*')
        .eq('host_user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserWalls(data || []);
    } catch (error) {
      console.error('Error loading walls:', error);
    } finally {
      setIsLoadingWalls(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/20">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 border">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Digital Memory Walls</span>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground mb-6">
              Create & Share
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Memory Walls
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Give any group an instant, shared canvas to post messages, doodles, photos, and videos 
              for special occasions. Zero friction, maximum memories.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button 
                  onClick={() => navigate('/create')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create New Wall
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/auth')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>

            {user && (
              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>Welcome back, {user.user_metadata?.display_name || user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section - Only show when not logged in */}
      {!user && (
        <div className="py-16 bg-card">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Perfect for Any Occasion
              </h2>
              <p className="text-lg text-muted-foreground">
                From graduations to birthdays, create lasting memories together
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Zero Friction</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    No sign-ups required for contributors. Just share a link or QR code and start collecting memories.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-secondary/50 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <CardTitle>Rich Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Text notes, hand-drawn sketches, photos, GIFs, and short videos. Express memories any way you want.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-accent/50 rounded-lg flex items-center justify-center mb-4">
                    <Gift className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <CardTitle>Always Free</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Create unlimited memory walls and collect unlimited memories. Completely free, forever. No hidden costs.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* User Walls Section */}
      {user && (
        <div className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Your Memory Walls</h2>
                <p className="text-muted-foreground">Manage and share your existing walls</p>
              </div>
              <Button onClick={() => navigate('/create')}>
                <Plus className="mr-2 h-4 w-4" />
                New Wall
              </Button>
            </div>

            {isLoadingWalls ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading your walls...</p>
              </div>
            ) : userWalls.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No walls yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first memory wall to get started</p>
                  <Button onClick={() => navigate('/create')}>
                    Create Your First Wall
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userWalls.map((wall) => (
                  <Card 
                    key={wall.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/wall/${wall.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{wall.name}</CardTitle>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: wall.theme_color }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Created {new Date(wall.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Index;
