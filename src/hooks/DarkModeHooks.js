import {useCallback, useEffect, useState} from 'react';
import {useDarkModeStore} from './DarkModeStore';
import {Appearance} from "react-native";

export const useDarkMode = () => {
    const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({colorScheme}) => {
            setColorScheme(colorScheme);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    return useDarkModeStore(useCallback(state => {
        return state.data?.darkMode === 'dark' || (state.data?.darkMode === 'system' && colorScheme === 'dark');
    }, [colorScheme]));
};

export const useDarkModeValue = () => {
    return useDarkModeStore(useCallback(state => {
        return state.data?.darkMode;
    }, []));
};
