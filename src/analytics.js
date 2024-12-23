import analytics from '@react-native-firebase/analytics';

const isDevelopment = process.env.EXPO_PUBLIC_IS_DEV;

export const logEvent = async (eventName, params = {}) => {
    if (isDevelopment) {
        console.log('Analytics event skipped in development:', { eventName, params });
        return;
    }

    try {
        await logEvent(eventName, params);
        console.log('Analytics event logged successfully:', { eventName, params });
    } catch (error) {
        console.error('Failed to log analytics event:', error);
    }
};

