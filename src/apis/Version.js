import { request } from '../request';
import { Platform } from 'react-native';
import * as Application from 'expo-application';

export const checkVersion = async () => {
    try {
        const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';
        
        // Get version code based on platform
        let versionCode;
        if (Platform.OS === 'ios') {
            // For iOS, use build number (e.g., 16)
            versionCode = parseInt(Application.nativeBuildVersion || '1');
        } else {
            // For Android, use versionCode from app.json (e.g., 5)
            // If not available, convert version string to number (e.g., "1.0.0" -> 100)
            const androidVersionCode = Application.nativeApplicationVersion;
            if (androidVersionCode && !isNaN(parseInt(androidVersionCode))) {
                versionCode = parseInt(androidVersionCode);
            } else {
                // Fallback: convert version string to number
                const versionString = Application.nativeApplicationVersion || '1.0.0';
                versionCode = parseInt(versionString.replace(/\./g, ''));
            }
        }

        console.log('Checking version:', { platform, versionCode });

        const response = await request('/app/version/check', {
            method: 'POST',
            body: {
                platform: platform,
                versionCode: versionCode
            }
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
                error: 'Failed to check version'
            };
        }
    } catch (error) {
        console.error('Version check error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
