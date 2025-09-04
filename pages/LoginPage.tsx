import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const GoogleIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.988,36.625,44,30.636,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


const LoginPage: React.FC = () => {
    const { user, signIn, error } = useAuth();
    const navigate = useNavigate();
    const signInButtonRef = useRef<HTMLDivElement>(null);
    // FIX: Add a ref to track if the sign-in button has been initialized.
    // This prevents the useEffect from re-initializing the button on every
    // re-render (e.g., when an error state is updated), which was causing
    // the error message to disappear immediately.
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (user) {
            navigate('/admin');
        } else {
            // Only initialize the Google Sign-In button once per component mount.
            if (!hasInitialized.current) {
                signIn(signInButtonRef);
                hasInitialized.current = true;
            }
        }
    }, [user, navigate, signIn]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)]">
            <div className="max-w-sm w-full bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 ring-1 ring-slate-200 dark:ring-gray-800 text-center">
                 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-100 dark:bg-gray-800 mb-6">
                    <GoogleIcon />
                 </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Sign In</h2>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative my-4 text-left" role="alert">
                        <strong className="font-bold">Login Failed: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">
                    Please sign in with your Google account to access the Admin Dashboard.
                </p>
                <div ref={signInButtonRef} className="flex justify-center">
                    {/* The Google Sign-In button will be rendered here by the AuthContext */}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;