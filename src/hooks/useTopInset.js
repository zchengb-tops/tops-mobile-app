import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useTopInset = () => {
    const insets = useSafeAreaInsets();
    return Platform.select({
        ios: insets.top,
        android: StatusBar.currentHeight || 0
    });
}; 