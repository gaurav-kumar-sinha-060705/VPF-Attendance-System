import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const CheckmarkIcon = () => (
    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
        <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
    </svg>
);

const SuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const successMessage = location.state?.message || "Your attendance has been submitted successfully.";


    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/'); // Redirect to home page
        }, 5000); // 5-second delay before redirecting

        return () => clearTimeout(timer); // Cleanup the timer if the component unmounts
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
            <div className="bg-white dark:bg-gray-900 p-10 rounded-2xl shadow-2xl max-w-md w-full ring-1 ring-slate-200 dark:ring-gray-800">
                <CheckmarkIcon />
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white mb-3 mt-4">
                    Success!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    {successMessage}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                    You will be redirected to the home page shortly.
                </p>
                <Link 
                    to="/" 
                    className="inline-block bg-sky-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-900"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default SuccessPage;