import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">Welcome to Wallable</h1>
        {user ? (
          <div className="space-y-4">
            <p className="text-xl text-muted-foreground">
              Hello, {user.email}! Ready to create memory walls?
            </p>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xl text-muted-foreground">
              Create and share digital memory walls for special occasions
            </p>
            <Button onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
