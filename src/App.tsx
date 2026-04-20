import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { determineStatus } from './lib/geo';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) handleLocationUpdate(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) handleLocationUpdate(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLocationUpdate = async (userId: string) => {
    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const status = determineStatus(latitude, longitude);

        try {
          // Bulletproof guarantee: Always make sure the profile exists
          await supabase.from('profiles').upsert({
            id: userId,
            name: session?.user?.user_metadata?.full_name || 'Anonymous User',
            email: session?.user?.email,
            avatar_url: session?.user?.user_metadata?.avatar_url
          }, { onConflict: 'id' });

          const { error } = await supabase.from('locations').upsert({
            user_id: userId,
            lat: latitude,
            lng: longitude,
            status: status,
            last_seen: new Date().toISOString(),
            online: true
          });
          if (error) {
            console.error('Error saving location:', error);
          }
        } catch (err) {
          console.error(err);
        }
      },
      (error) => {
        console.error("Location error", error);
        toast.error("Please enable location to let friends know where you are!");
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  useEffect(() => {
    // Set offline on unmount/close
    const handleUnload = () => {
      if (session) {
        // We use sendBeacon for reliable delivery on unload
        const blob = new Blob([JSON.stringify({
          user_id: session.user.id,
          online: false,
          last_seen: new Date().toISOString()
        })], { type: 'application/json' });
        // NOTE: A real implementation would use an Edge function or a specific endpoint
        navigator.sendBeacon('/api/offline', blob);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [session]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      {session ? (
        <Dashboard user={session.user} onSignOut={async () => {
          // Immediately set them offline before cutting credentials!
          await supabase.from('locations').update({ online: false }).eq('user_id', session.user.id);
          await supabase.auth.signOut();
        }} />
      ) : (
        <Auth />
      )}
    </>
  );
}
