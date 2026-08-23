import React from 'react';
import { SearchX, BookOpen, GraduationCap, FileText, Users, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionButton?: React.ReactNode;
  variant?: 'default' | 'students' | 'exams' | 'library' | 'homework' | 'generic';
}

// Preset icons for common use cases
const getPresetIcon = (variant: EmptyStateProps['variant']) => {
  switch (variant) {
    case 'students':
      return <GraduationCap size={48} />;
    case 'exams':
      return <FileText size={48} />;
    case 'library':
      return <BookOpen size={48} />;
    case 'homework':
      return <FolderOpen size={48} />;
    case 'generic':
      return <Users size={48} />;
    default:
      return <SearchX size={48} />;
  }
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
  variant = 'default'
}) => {
  const displayIcon = icon || getPresetIcon(variant);

  return (
    <div className="relative overflow-hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-indigo-500/10 dark:from-slate-800/40 dark:via-slate-900/20 dark:to-indigo-900/10 rounded-[3rem]" />
      <div className="absolute inset-0 backdrop-blur-xl rounded-[3rem]" />
      <div className="absolute inset-0 border border-white/30 dark:border-slate-700/30 rounded-[3rem] shadow-2xl" />

      {/* Main content */}
      <div className="relative flex flex-col items-center justify-center p-12 text-center">
        {/* Icon container with glassmorphism */}
        <div className="w-28 h-28 bg-gradient-to-br from-white/60 to-indigo-100/40 dark:from-slate-800/60 dark:to-indigo-900/40 rounded-[2.5rem] flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6 shadow-lg backdrop-blur-md border border-white/40 dark:border-slate-700/40 transform hover:scale-110 hover:rotate-6 transition-all duration-500 cursor-default">
          {displayIcon}
        </div>

        {/* Title with gradient text */}
        <h3 className="text-2xl font-black bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent tracking-tight mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-base font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          {description}
        </p>

        {/* Action button */}
        {actionButton && (
          <div className="mt-2 transform hover:scale-105 transition-transform duration-300">
            {actionButton}
          </div>
        )}
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-8 left-8 w-3 h-3 bg-indigo-400/30 rounded-full animate-pulse" />
      <div className="absolute bottom-10 right-10 w-2 h-2 bg-emerald-400/30 rounded-full animate-pulse delay-700" />
      <div className="absolute top-12 right-16 w-4 h-4 bg-amber-400/20 rounded-full animate-pulse delay-500" />
    </div>
  );
};

export default EmptyState;
