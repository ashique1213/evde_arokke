import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { determineStatus } from './lib/geo';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) startTracking(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) startTracking(session);
      else stopTracking();
    });

    return () => {
      subscription.unsubscribe();
      stopTracking();
    };
  }, []);

  const stopTracking = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const startTracking = async (currentSession: any) => {
    if (!('geolocation' in navigator)) return;
    stopTracking();

    const userId = currentSession.user.id;

    // Make sure profile always exists before tracking loop starts
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        name: currentSession.user.user_metadata?.full_name || 'Anonymous User',
        email: currentSession.user.email,
        avatar_url: currentSession.user.user_metadata?.avatar_url
      }, { onConflict: 'id' });
    } catch (err) {
      console.error("Profile sync err", err);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const status = determineStatus(latitude, longitude);

        try {
          const { error } = await supabase.from('locations').upsert({
            user_id: userId,
            lat: latitude,
            lng: longitude,
            status: status,
            last_seen: new Date().toISOString(),
            online: true
          });
          if (error) console.error('Error saving location:', error);
        } catch (err) {
          console.error(err);
        }
      },
      (error) => {
        console.error("Location error", error);
        toast.error("Please enable location to let friends know where you are!");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
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
