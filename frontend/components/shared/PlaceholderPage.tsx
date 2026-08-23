import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
    title: string;
    description?: string;
    estimatedRelease?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
    title,
    description = 'This feature is currently under development.',
    estimatedRelease,
}) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
                    <Construction className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-gray-400 mb-4">{description}</p>
                    {estimatedRelease && (
                        <p className="text-sm text-indigo-300 mb-6">
                            Estimated release: {estimatedRelease}
                        </p>
                    )}
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaceholderPage;