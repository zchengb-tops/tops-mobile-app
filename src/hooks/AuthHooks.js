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
            set({ isLoggedIn: !!token });
            if (token) {
                getUserInfo(token).then(async response => {
                    if (response.ok) {
                        const data = await response.json();
                        set({ userInfo: data });
                        storage.set('userInfo', JSON.stringify(data));
                    } else {
                        Burnt.toast({
                            title: '获取用户信息失败',
                            preset: 'error',
                        });
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