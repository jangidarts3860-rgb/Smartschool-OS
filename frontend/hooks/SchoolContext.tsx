import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db } from '@/services/firebase';
import { auth } from '@/services/firebase';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { School, SchoolConfig, UserRole } from '@/types';
import { getDoc } from 'firebase/firestore';

const DEFAULT_CONFIG: SchoolConfig = {
    primaryColor: '#4f46e5',
    secondaryColor: '#0f172a',
    logoUrl: '/logo.svg',
    subdomain: 'demo',
    aiFallback: true
};

const IS_DEMO_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

const MOCK_SCHOOL: School = {
    id: 'SCH01',
    name: 'SmartSchool International',
    config: DEFAULT_CONFIG
} as School;

interface TenantContextType {
    school: School | null;
    loading: boolean;
    isBlocked: boolean;
    branding: SchoolConfig;
    refreshSchool: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [school, setSchool] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    const detectTenant = async () => {
        const hostname = window.location.hostname;

        if (IS_DEMO_MODE) {
            setSchool(MOCK_SCHOOL);
            setLoading(false);
            return;
        }

        let foundSchool: School | null = null;

        try {
            // 0. Check for Ghost Mode Override (Admin/SuperAdmin only)
            const urlParams = new URLSearchParams(window.location.search);
            const ghostSchoolId = urlParams.get('ghost_school_id');

            if (ghostSchoolId) {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    console.warn('Ghost mode rejected: not authenticated');
                } else {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    const userRole = userDoc.exists() ? userDoc.data()?.role : null;
                    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
                        const schoolDoc = await getDocs(query(collection(db, 'schools'), where('__name__', '==', ghostSchoolId)));
                        if (!schoolDoc.empty) {
                            foundSchool = { ...schoolDoc.docs[0].data() as School, id: schoolDoc.docs[0].id };
                        }
                    } else {
                        console.warn('Ghost mode rejected: insufficient role', userRole);
                    }
                }
            }

            if (!foundSchool) {
                // 1. Check for Custom Domain
                const customDomainQuery = query(
                    collection(db, 'schools'),
                    where('config.customDomain', '==', hostname)
                );
                const customSnapshot = await getDocs(customDomainQuery);

                if (!customSnapshot.empty) {
                    foundSchool = { ...customSnapshot.docs[0].data() as School, id: customSnapshot.docs[0].id };
                } else {
                    // 2. Check for Subdomain
                    const subdomain = hostname.split('.')[0];
                    const subdomainQuery = query(
                        collection(db, 'schools'),
                        where('config.subdomain', '==', subdomain)
                    );
                    const subSnapshot = await getDocs(subdomainQuery);

                    if (!subSnapshot.empty) {
                        foundSchool = { ...subSnapshot.docs[0].data() as School, id: subSnapshot.docs[0].id };
                    }
                }
            }

            if (foundSchool) {
                setSchool(foundSchool);
            }
        } catch (err) {
            // Tenant detection error - non-critical but worth logging
            console.warn('[SchoolContext] tenant detect failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        detectTenant();
    }, []);

    // REAL-TIME UPDATES: Listen for school config changes
    useEffect(() => {
        if (!school?.id) return;
        if (IS_DEMO_MODE) return;

        const unsubscribe = onSnapshot(doc(db, 'schools', school.id), (doc) => {
            if (doc.exists()) {
                const updatedData = doc.data() as School;
                setSchool({ ...updatedData, id: doc.id });
                
                // Update CSS Variables Instantly
                const root = document.documentElement;
                const config = updatedData.config || DEFAULT_CONFIG;
                root.style.setProperty('--primary-color', config.primaryColor);
                root.style.setProperty('--secondary-color', config.secondaryColor);
                if (config.fontFamily) {
                    root.style.setProperty('--font-family', config.fontFamily);
                }
                document.title = `${updatedData.name} | SmartSchool OS`;
            }
        });

        return () => unsubscribe();
}, [school?.id]);

    const contextValue = useMemo(() => ({
        school, 
        loading, 
        isBlocked, 
        branding: school?.config || DEFAULT_CONFIG,
        refreshSchool: detectTenant
    }), [school, loading, isBlocked]);

    return (
        <TenantContext.Provider value={contextValue}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) throw new Error('useTenant must be used within a TenantProvider');
    return context;
};
