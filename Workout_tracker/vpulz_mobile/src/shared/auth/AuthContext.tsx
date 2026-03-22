import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../sync/supabaseClient';
import { flushQueuedSyncForUser, pullUserData, pushTrackerSnapshot } from '../sync/cloudSyncService';
import { loadTrackerSnapshot, saveTrackerSnapshot } from '../state/workoutTrackerStore';
import { hasTrackerData, mergeTrackerSnapshots } from '../sync/syncMerge';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    if (!supabase) {
      setInitialized(true);
      return;
    }

    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setSession(data.session ?? null);
      setInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitialized(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      return;
    }

    let mounted = true;

    void flushQueuedSyncForUser(userId)
      .then(async () => {
        const localTracker = await loadTrackerSnapshot();
        const { tracker: cloudTracker } = await pullUserData(userId);

        if (!mounted) {
          return;
        }

        if (!cloudTracker && hasTrackerData(localTracker)) {
          await pushTrackerSnapshot(userId, localTracker);
          return;
        }

        const mergedTracker = mergeTrackerSnapshots(localTracker, cloudTracker);
        if (!hasTrackerData(mergedTracker)) {
          return;
        }

        await saveTrackerSnapshot(mergedTracker);
        await pushTrackerSnapshot(userId, mergedTracker);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      initialized,
      signIn: async (email, password) => {
        if (!supabase) {
          return;
        }
        await supabase.auth.signInWithPassword({ email, password });
      },
      register: async (email, password) => {
        if (!supabase) {
          return;
        }
        await supabase.auth.signUp({ email, password });
      },
      signOut: async () => {
        if (!supabase) {
          return;
        }
        await supabase.auth.signOut();
      },
    }),
    [initialized, session, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
