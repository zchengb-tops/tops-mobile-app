import { useEffect } from 'react';
import { create } from 'zustand';
import { getUserInfo } from '../apis/User';
import { storage } from '../storage';

const useAuthStore = create((set) => ({
    isLoggedIn: false,
    userInfo: null,
    
    loadUserInfo: async () => {
        try {
            const token = storage.getString('accessToken');
            const cachedUserInfo = storage.getString('userInfo');
            
            set({ isLoggedIn: !!token });
            
            if (token) {
                if (cachedUserInfo) {
                    try {
                        const parsedUserInfo = JSON.parse(cachedUserInfo);
                        set({ userInfo: parsedUserInfo });
                        console.log('Loaded cached user info:', parsedUserInfo);
                    } catch (error) {
                        console.error('Error parsing cached user info:', error);
                    }
                }
                
                getUserInfo(token).then(async response => {
                    if (response.ok) {
                        const data = await response.json();
                        set({ userInfo: data });
                        storage.set('userInfo', JSON.stringify(data));
                        console.log('Updated user info from server:', data);
                    } else {
                        console.error('Failed to fetch user info from server');
                    }
                });
            } else {
                set({ isLoggedIn: false, userInfo: null });
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            set({ isLoggedIn: false, userInfo: null });
        }
    },
}));

export const useAuth = () => {
    const { isLoggedIn, userInfo, loadUserInfo } = useAuthStore();
    
    useEffect(() => {
        loadUserInfo();
    }, []);
    
    const logout = async () => {
        storage.delete('accessToken');
        storage.delete('userInfo');
        storage.delete('lastSyncTime');
        storage.delete('isSyncEnabled');
        await loadUserInfo();
    };
    
    return {
        isLoggedIn,
        userInfo,
        loadUserInfo,
        logout
    };
};