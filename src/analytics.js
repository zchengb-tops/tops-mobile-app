import analytics from '@react-native-firebase/analytics';

const isDevelopment = __DEV__ || process.env.EXPO_PUBLIC_IS_DEV === 'true';

export const logEvent = async (eventName, params = {}) => {
    if (isDevelopment) {
        console.log('Analytics event skipped in development:', { eventName, params });
        return;
    }

    try {
        await analytics().logEvent(eventName, params);
        console.log('Analytics event logged successfully:', { eventName, params });
    } catch (error) {
        console.warn('Analytics event failed (this is normal in development):', error.message);
    }
};