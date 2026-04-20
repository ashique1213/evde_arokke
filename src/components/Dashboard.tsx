import React from 'react';
import type { UserLocation } from '../types';
import { MapView } from './MapView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';
import { LogOut, RefreshCw, Settings, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function Dashboard({ user, onSignOut }: { user: any, onSignOut: () => void }) {
  const [locations, setLocations] = React.useState<UserLocation[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchLocations = async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from('locations')
      .select('*, profiles:user_id(name, avatar_url, nickname)')
      .order('last_seen', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('Could not load locations');
    } else {
      setLocations(data as unknown as UserLocation[]);
    }
    setRefreshing(false);
  };

  React.useEffect(() => {
    fetchLocations();
    
    // Realtime subscription
    const channel = supabase
      .channel('public:locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, (payload) => {
        // Simple notification
        if (payload.new && (payload.new as UserLocation).status === 'In Korome') {
          toast.success('Someone just arrived in Korome!');
        }
        fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const inKorome = locations.filter(l => l.status === 'In Korome');
  const others = locations.filter(l => l.status !== 'In Korome');

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <header className="px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 border-b border-border shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-600 tracking-tight">
          Naatil Aarokke?
        </h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={fetchLocations} disabled={refreshing}>
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <div className="flex items-center gap-2 border-l border-border pl-3">
             <div className="w-8 h-8 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center">
               {user?.user_metadata?.avatar_url ? (
                 <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <Users className="w-4 h-4 text-muted-foreground" />
               )}
             </div>
             <Button variant="ghost" size="sm" onClick={onSignOut} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
               <LogOut className="w-4 h-4 mr-1.5" />
               Sign out
             </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col pt-4 px-4 sm:px-8 max-w-5xl mx-auto w-full gap-4">
        
        <Tabs defaultValue="map" className="flex-1 flex flex-col h-full overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 mb-4 rounded-xl">
            <TabsTrigger value="map" className="rounded-lg data-[state=active]:shadow-sm">Map View</TabsTrigger>
            <TabsTrigger value="list" className="rounded-lg data-[state=active]:shadow-sm">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map" className="flex-1 mt-0 data-[state=inactive]:hidden mb-4">
            <MapView locations={locations} />
          </TabsContent>
          
          <TabsContent value="list" className="flex-1 mt-0 data-[state=inactive]:hidden overflow-y-auto pr-2 pb-4">
            <div className="space-y-6 pb-20">
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-500">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  In Korome Now ({inKorome.length})
                </h2>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {inKorome.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">No one is currently in Korome.</p>
                  ) : (
                    inKorome.map(loc => <UserCard key={loc.user_id} loc={loc} />)
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Others ({others.length})
                </h2>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                   {others.map(loc => <UserCard key={loc.user_id} loc={loc} />)}
                </div>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </main>

    </div>
  );
}

function UserCard({ loc }: { loc: UserLocation }) {
  const isOnline = loc.online;
  const isPresent = loc.status === 'In Korome';
  
  return (
    <Card className="glass-card shadow-sm border-white/40 dark:border-white/10 hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-background">
             {loc.profiles?.avatar_url ? (
               <img src={loc.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {loc.profiles?.name?.charAt(0) || '?'}
               </div>
             )}
          </div>
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold truncate text-[15px]">{loc.profiles?.name || 'Unknown'}</h3>
            <Badge variant={isPresent ? "default" : "secondary"} className={isPresent ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' : ''}>
              {loc.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Last seen {formatDistanceToNow(new Date(loc.last_seen), { addSuffix: true })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
