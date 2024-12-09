import {create} from 'zustand';
import {MMKV} from 'react-native-mmkv';

const storage = new MMKV();

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