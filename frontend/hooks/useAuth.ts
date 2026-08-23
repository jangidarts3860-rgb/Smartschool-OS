import { useState, useEffect } from "react";
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from "firebase/auth";
import { auth } from "@/services/firebase";

const IS_MOCK_MODE = true;

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        // In mock mode, skip Firebase Auth entirely — never "loading"
        loading: !IS_MOCK_MODE,
        error: null
    });

    useEffect(() => {
        // MOCK MODE: Do NOT touch Firebase Auth at all.
        // Profile comes from localStorage via authService, not Firebase.
        if (IS_MOCK_MODE) {
            setAuthState({ user: null, loading: false, error: null });
            return;
        }

        // Reset error on mount
        setAuthState(prev => ({ ...prev, error: null }));
        
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                setAuthState({
                    user,
                    loading: false,
                    error: null
                });
            },
            (error) => {
                setAuthState({
                    user: null,
                    loading: false,
                    error: error.message || 'Authentication error occurred'
                });
            }
        );

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Login failed";
            setAuthState((prev) => ({ ...prev, loading: false, error: message }));
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setAuthState({ user: null, loading: false, error: null });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Logout failed";
            setAuthState((prev) => ({ ...prev, error: message }));
            throw error;
        }
    };

    return {
        ...authState,
        signIn,
        signOut,
        isAuthenticated: !!authState.user
    };
}