import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google: any;
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (buttonRef: React.RefObject<HTMLDivElement>) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL as string;


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check for existing session on initial load
        try {
            const storedUser = sessionStorage.getItem('vpf-user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from session storage", error);
            sessionStorage.removeItem('vpf-user');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCredentialResponse = useCallback(async (response: any) => {
        setLoading(true);
        setError(null);
        try {
            const apiResponse = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                // FIX: Use 'text/plain' to avoid CORS preflight issues with Google Apps Script.
                // The body is still a JSON string, which Apps Script can parse.
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'verifyAdminToken',
                    token: response.credential,
                }),
            });

            const result = await apiResponse.json();

            if (result.success && result.user) {
                const newUser: User = result.user;
                setUser(newUser);
                sessionStorage.setItem('vpf-user', JSON.stringify(newUser));
                navigate('/admin');
            } else {
                console.error("Admin verification failed:", result.message);
                setError(result.message || "Access denied. You are not an authorized administrator.");
                if (window.google) {
                    window.google.accounts.id.disableAutoSelect();
                }
            }
        } catch (err) {
            console.error("Error during admin verification:", err);
            setError("An error occurred while trying to sign in. Please try again.");
            if (window.google) {
                window.google.accounts.id.disableAutoSelect();
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);
    
    const signIn = useCallback((buttonRef: React.RefObject<HTMLDivElement>) => {
        // FIX: Removed setError(null) from this function. The error should only be
        // cleared when a new sign-in attempt is processed (in handleCredentialResponse),
        // not when the button is rendered. This prevents the error message from
        // being hidden on re-render.
        if (!window.google) {
            console.error("Google Identity Services script not loaded.");
            setError("Could not connect to Google Sign-In. Please try again later.");
            return;
        }
        
        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
            });

            if (buttonRef.current) {
                window.google.accounts.id.renderButton(
                    buttonRef.current,
                    { theme: "outline", size: "large", type: "standard", text: "signin_with" }
                );
            }
            // Optional: Prompt for login automatically if not logged in
            // window.google.accounts.id.prompt(); 
        } catch(err) {
            console.error("Google Sign-In initialization error:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during sign-in.";
            setError(`Initialization failed: ${errorMessage}`);
        }
    }, [handleCredentialResponse]);

    const signOut = () => {
        setLoading(true);
        setUser(null);
        sessionStorage.removeItem('vpf-user');
        setError(null);
        if (window.google) {
            window.google.accounts.id.disableAutoSelect();
        }
        navigate('/');
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};