import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, Loader2, UserPlus } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      // Redirect based on role
      switch (role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'teacher':
          navigate('/teacher');
          break;
        case 'student':
          navigate('/student');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, role, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display text-foreground">Meranos Nigeria</CardTitle>
            <CardDescription className="text-muted-foreground">
              TVET Training Portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" variant="gold" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                New applicant?
              </span>
            </div>
          </div>

          {/* Apply Button */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Want to enroll in our training programs?
            </p>
            <Link to="/register">
              <Button variant="outline" className="w-full group">
                <UserPlus className="w-4 h-4 mr-2" />
                Apply for Enrollment
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
