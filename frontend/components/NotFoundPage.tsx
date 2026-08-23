import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">404 — Page Not Found</h2>
                    <p className="text-gray-400 mb-6">
                        The page you are looking for does not exist or has been moved.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
