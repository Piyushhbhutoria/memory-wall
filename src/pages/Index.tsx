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
    <div className="min-h-screen">
      {/* Header */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8 animate-fade-in">
              <div className="glass flex items-center gap-2 rounded-full px-6 py-3 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary animate-pulse-glow" />
                <span className="text-sm font-medium bg-gradient-primary bg-clip-text text-transparent">
                  Digital Memory Walls
                </span>
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Create & Share
              <span className="block gradient-text font-serif italic">
                Memory Walls
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Give any group an instant, shared canvas to post messages, doodles, photos, and videos 
              for special occasions. <span className="text-primary font-semibold">Zero friction, maximum memories.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {user ? (
                <Button 
                  onClick={() => navigate('/create')}
                  variant="gradient"
                  size="xl"
                  className="group"
                >
                  <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  Create New Wall
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/auth')}
                  variant="gradient"
                  size="xl"
                  className="group"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              )}
            </div>

            {user && (
              <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <span className="font-medium">Welcome back, {user.user_metadata?.display_name || user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section - Only show when not logged in */}
      {!user && (
        <div className="py-20 bg-card/30 backdrop-blur-sm border-y border-border/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl font-bold mb-6 font-serif">
                Perfect for Any Occasion
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                From graduations to birthdays, create lasting memories together
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-elevated hover-lift group">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-serif">Zero Friction</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed">
                    No sign-ups required for contributors. Just share a link or QR code and start collecting memories instantly.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="card-elevated hover-lift group">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-serif">Rich Content</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed">
                    Text notes, hand-drawn sketches, photos, GIFs, and short videos. Express memories any way you want.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="card-elevated hover-lift group">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-border">
                    <Gift className="h-8 w-8 text-foreground" />
                  </div>
                  <CardTitle className="text-xl font-serif">Always Free</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed">
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
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10 animate-fade-in">
              <div>
                <h2 className="text-3xl font-bold font-serif">Your Memory Walls</h2>
                <p className="text-muted-foreground text-lg mt-2">Manage and share your existing walls</p>
              </div>
              <Button onClick={() => navigate('/create')} variant="gradient" size="lg" className="group">
                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                New Wall
              </Button>
            </div>

            {isLoadingWalls ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-lg">Loading your walls...</p>
                </div>
              </div>
            ) : userWalls.length === 0 ? (
              <Card className="card-elevated text-center py-16 animate-fade-in">
                <CardContent>
                  <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-6 animate-float">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold font-serif mb-3">No walls yet</h3>
                  <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                    Create your first memory wall to start collecting beautiful moments
                  </p>
                  <Button onClick={() => navigate('/create')} variant="gradient" size="lg">
                    Create Your First Wall
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userWalls.map((wall, index) => (
                  <Card 
                    key={wall.id} 
                    className="card-elevated card-interactive group animate-fade-in"
                    onClick={() => navigate(`/wall/${wall.id}`)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors">
                          {wall.name}
                        </CardTitle>
                        <div 
                          className="w-5 h-5 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: wall.theme_color }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Created {new Date(wall.created_at).toLocaleDateString()}</span>
                        </div>
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
