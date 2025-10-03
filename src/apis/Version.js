import { request } from '../request';
import { Platform } from 'react-native';
import * as Application from 'expo-application';

export const getAllVersions = async () => {
    try {
        const response = await request('/app/versions', {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } else {
            return {
                success: false,
                error: 'Failed to fetch versions'
            };
        }
    } catch (error) {
        console.error('Version fetch error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const compareVersions = (currentVersion, latestVersion) => {
    const parseVersion = (version) => {
        return version.split('.').map(num => parseInt(num, 10));
    };

    const current = parseVersion(currentVersion);
    const latest = parseVersion(latestVersion);
    
    const maxLength = Math.max(current.length, latest.length);
    
    for (let i = 0; i < maxLength; i++) {
        const currentPart = current[i] || 0;
        const latestPart = latest[i] || 0;
        
        if (currentPart < latestPart) {
            return -1;
        } else if (currentPart > latestPart) {
            return 1;
        }
    }
    
    return 0;
};

export const checkVersion = async () => {
    try {
        const currentPlatform = Platform.OS === 'ios' ? 'ios' : 'android';
        
        // Get current version information
        const currentVersionString = Application.nativeApplicationVersion || '1.0.0';
        let currentVersionCode;
        
        if (Platform.OS === 'ios') {
            currentVersionCode = parseInt(Application.nativeBuildVersion || '1');
        } else {
            const buildVersion = Application.nativeBuildVersion;
            if (buildVersion && !isNaN(parseInt(buildVersion))) {
                currentVersionCode = parseInt(buildVersion);
            } else {
                currentVersionCode = parseInt(currentVersionString.replace(/\./g, ''));
            }
        }

        console.log('Checking version:', { 
            platform: currentPlatform, 
            currentVersion: currentVersionString,
            currentVersionCode 
        });

        // Get all versions from backend
        const versionsResult = await getAllVersions();
        
        if (!versionsResult.success) {
            return versionsResult;
        }

        // Find the version for current platform
        const platformVersion = versionsResult.data.versions[currentPlatform];

        if (!platformVersion) {
            console.log('No version found for platform:', currentPlatform);
            return {
                success: true,
                data: { hasUpdate: false }
            };
        }

        // First compare semantic versions (e.g., "1.0.1" vs "1.0.0")
        const versionComparison = compareVersions(currentVersionString, platformVersion.latestVersion);
        let hasUpdate = false;
        
        if (versionComparison < 0) {
            // Current version is older based on semantic version
            hasUpdate = true;
            console.log('Update available (semantic version):', {
                current: currentVersionString,
                latest: platformVersion.latestVersion
            });
        } else if (versionComparison === 0) {
            // Semantic versions are equal, compare version codes as fallback
            hasUpdate = platformVersion.latestVersionCode > currentVersionCode;
            if (hasUpdate) {
                console.log('Update available (version code):', {
                    current: currentVersionCode,
                    latest: platformVersion.latestVersionCode
                });
            }
        } else {
            // Current version is newer than latest (shouldn't happen in normal cases)
            console.log('Current version is newer than server version:', {
                current: currentVersionString,
                latest: platformVersion.latestVersion
            });
        }
        
        if (!hasUpdate) {
            console.log('Client version is up to date:', {
                version: currentVersionString,
                versionCode: currentVersionCode
            });
            return {
                success: true,
                data: { hasUpdate: false }
            };
        }

        return {
            success: true,
            data: {
                hasUpdate: true,
                latestVersion: platformVersion.latestVersion,
                latestVersionCode: platformVersion.latestVersionCode,
                isMandatory: platformVersion.isMandatory,
                updateMessage: platformVersion.updateMessage,
                updateUrl: platformVersion.updateUrl
            }
        };
    } catch (error) {
        console.error('Version check error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
