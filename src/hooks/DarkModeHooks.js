import {useCallback, useEffect, useState} from 'react';
import {Appearance} from "react-native";
import {create} from "zustand";
import {storage} from "../storage";

export const useDarkModeStore = create(
    (set) => ({
        data: {
            darkMode: storage.getString('darkMode') || 'system'
        },
        setDarkMode: (darkMode) => {
            storage.set('darkMode', darkMode);
            set((state) => ({
                data: {
                    ...state.data,
                    darkMode: darkMode,
                },
            }));
        },
    })
);

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
