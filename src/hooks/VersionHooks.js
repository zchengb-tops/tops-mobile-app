import { useState, useEffect, useCallback } from 'react';
import { checkVersion } from '../apis/Version';
import { storage } from '../storage';
import * as Burnt from 'burnt';

export const useVersionCheck = () => {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const checkForUpdates = useCallback(async (force = false) => {
        try {
            console.log('🔍 Starting version check...', { force });
            setIsLoading(true);
            
            const lastSkippedVersion = storage.getString('lastSkippedVersion');

            console.log('📡 Calling checkVersion API...');
            const result = await checkVersion();
            console.log('📱 Version check result:', result);
            
            if (result.success && result.data.hasUpdate) {
                const { latestVersion, isMandatory } = result.data;
                console.log('🎯 Update available:', { latestVersion, isMandatory, lastSkippedVersion });
                
                // Skip showing modal for optional updates if user already dismissed this version
                if (!isMandatory && lastSkippedVersion === latestVersion) {
                    console.log('🙈 User already skipped this version');
                    if (force) {
                        Burnt.toast({
                            title: '已是最新版本',
                            preset: 'done',
                            duration: 2,
                        });
                    }
                    return;
                }
                
                console.log('🚀 Showing update modal');
                setUpdateInfo(result.data);
                setShowModal(true);
            } else if (result.success && force) {
                console.log('✅ No update available (manual check)');
                // Manual check with no update available
                Burnt.toast({
                    title: '已是最新版本',
                    preset: 'done',
                    duration: 2,
                });
            } else if (result.success) {
                console.log('✅ No update available (auto check)');
            } else {
                console.log('❌ Version check failed:', result.error);
            }
        } catch (error) {
            console.error('❌ Version check failed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const hideModal = () => {
        if (updateInfo && !updateInfo.isMandatory) {
            // Remember that user skipped this version
            storage.set('lastSkippedVersion', updateInfo.latestVersion);
        }
        setShowModal(false);
        // Don't clear updateInfo immediately to allow modal to animate out
        setTimeout(() => {
            setUpdateInfo(null);
        }, 300);
    };

    // Auto check on app launch - immediate check
    useEffect(() => {
        console.log('🚀 App launched - checking for updates immediately');
        checkForUpdates();
    }, [checkForUpdates]);


    const clearVersionCache = () => {
        console.log('🗑️ Clearing version check cache');
        storage.delete('lastVersionCheckTime');
        storage.delete('lastSkippedVersion');
    };

    return {
        updateInfo,
        isLoading,
        showModal,
        checkForUpdates,
        hideModal,
        clearVersionCache
    };
};
