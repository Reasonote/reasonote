import React from 'react';

import { useSupabase } from '../contexts/SupabaseContext';
import { AuthButtons } from './AuthButtons';

interface AuthGuardProps {
    children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { supabase } = useSupabase();
    const [session, setSession] = React.useState<any>(null);

    React.useEffect(() => {
        // Get initial session
        supabase?.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // Listen for auth changes
        supabase?.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            // subscription.unsubscribe();
        };
    }, [supabase]);

    if (!session) {
        return <AuthButtons />;
    }

    return <>{children}</>;
}; 