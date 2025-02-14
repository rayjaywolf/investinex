"use client";

import { useEffect } from 'react';
import Cookies from 'js-cookie';

export function useEligibilitySync() {
    useEffect(() => {
        // Sync localStorage to cookies
        const isEligible = localStorage.getItem('isEligible') === 'true';
        if (isEligible) {
            Cookies.set('isEligible', 'true', { expires: 7 }); // Cookie expires in 7 days
        } else {
            Cookies.remove('isEligible');
        }
    }, []);

    return null;
} 