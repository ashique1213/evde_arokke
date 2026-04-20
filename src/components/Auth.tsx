import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { MapPin } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert('Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-xl shadow-primary/20">
            <MapPin size={40} />
          </div>
        </div>
        <Card className="glass-card border-none shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl font-bold font-sans bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-600">
              Naatil Aarokke?
            </CardTitle>
            <CardDescription className="text-base mt-2">
              See who is in Korome right now!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-8 pb-8">
            <Button 
              size="lg" 
              className="w-full font-semibold relative overflow-hidden group shadow-lg"
              onClick={handleGoogleLogin} 
              disabled={loading}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              By joining, you allow friends to know your general location to help plan meetups.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
