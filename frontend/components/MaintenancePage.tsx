import React from 'react';
import { Wrench, Phone, Mail } from 'lucide-react';

interface Props {
  message?: string;
  schoolName?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  logoUrl?: string;
}

const MaintenancePage: React.FC<Props> = ({
  message = 'School is currently under maintenance. Please check back later.',
  schoolName = 'SmartSchool',
  schoolPhone,
  schoolEmail,
  logoUrl
}) => {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo / Icon */}
        <div className="mx-auto w-24 h-24 bg-zinc-800 rounded-3xl flex items-center justify-center border border-zinc-700">
          {logoUrl ? (
            <img src={logoUrl} alt={schoolName} className="w-16 h-16 object-contain" />
          ) : (
            <Wrench size={40} className="text-zinc-500" />
          )}
        </div>

        {/* School Name */}
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{schoolName}</h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">System Maintenance</p>
        </div>

        {/* Message */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-sm text-zinc-300 leading-relaxed">{message}</p>
        </div>

        {/* Contact Info */}
        {(schoolPhone || schoolEmail) && (
          <div className="space-y-3">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Contact School Admin</p>
            <div className="flex items-center justify-center gap-6">
              {schoolPhone && (
                <a href={`tel:${schoolPhone}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  <Phone size={14} />
                  <span className="text-xs font-medium">{schoolPhone}</span>
                </a>
              )}
              {schoolEmail && (
                <a href={`mailto:${schoolEmail}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                  <Mail size={14} />
                  <span className="text-xs font-medium">{schoolEmail}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-[9px] text-zinc-700 font-medium">
          We apologize for the inconvenience. Service will resume shortly.
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
