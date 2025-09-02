import { useState, useEffect } from 'react';
import { checkVersion } from '../apis/Version';
import { storage } from '../storage';
import * as Burnt from 'burnt';

export const useVersionCheck = () => {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const checkForUpdates = async (force = false) => {
        try {
            setIsLoading(true);
            
            // Check if we should skip version check (for optional updates)
            const lastSkippedVersion = storage.getString('lastSkippedVersion');
            const lastCheckTime = storage.getNumber('lastVersionCheckTime') || 0;
            const now = Date.now();
            const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

            // Skip check if not forced and checked recently (within 1 hour)
            if (!force && (now - lastCheckTime) < oneHour) {
                return;
            }

            const result = await checkVersion();
            
            if (result.success && result.data.hasUpdate) {
                const { latestVersion, isMandatory } = result.data;
                
                // Skip showing modal for optional updates if user already dismissed this version
                if (!isMandatory && lastSkippedVersion === latestVersion) {
                    if (force) {
                        Burnt.toast({
                            title: '已是最新版本',
                            preset: 'done',
                            duration: 2,
                        });
                    }
                    return;
                }
                
                setUpdateInfo(result.data);
                setShowModal(true);
            } else if (result.success && force) {
                // Manual check with no update available
                Burnt.toast({
                    title: '已是最新版本',
                    preset: 'done',
                    duration: 2,
                });
            }
            
            // Update last check time
            storage.set('lastVersionCheckTime', now);
            
        } catch (error) {
            console.error('Version check failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const hideModal = () => {
        if (updateInfo && !updateInfo.isMandatory) {
            // Remember that user skipped this version
            storage.set('lastSkippedVersion', updateInfo.latestVersion);
        }
        setShowModal(false);
        setUpdateInfo(null);
    };

    // Auto check on app launch
    useEffect(() => {
        const timer = setTimeout(() => {
            checkForUpdates();
        }, 2000); // Wait 2 seconds after app launch

        return () => clearTimeout(timer);
    }, []);

    return {
        updateInfo,
        isLoading,
        showModal,
        checkForUpdates,
        hideModal
    };
};
