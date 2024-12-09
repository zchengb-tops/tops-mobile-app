import {useCallback} from 'react';
import {useDarkModeStore} from './DarkModeStore';
import {Appearance} from "react-native";

export const useDarkMode = () => {
    return useDarkModeStore(useCallback(state => {
        return state.data?.darkMode === 'dark' || (state.data?.darkMode === 'system' && Appearance.getColorScheme() === 'dark');
    }, []));
};

export const useDarkModeValue = () => {
    return useDarkModeStore(useCallback(state => {
        return state.data?.darkMode;
    }, []));
};

export class darkModeHooks {
}