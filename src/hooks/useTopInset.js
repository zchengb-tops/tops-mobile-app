import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export const useTopInset = () => {
    const insets = useSafeAreaInsets();
    return Platform.select({
        ios: insets.top,
        android: 32
    });
}; 