import { useCallback } from 'react';
import { create } from "zustand";

export const useTabStore = create(
    (set) => ({
        data: {
            tabIndex: 0,
            triggerByTabBar: false,
        },
        setTabIndex: (tabIndex, triggerByTabBar = false) => {
            set((state) => ({
                data: {
                    ...state.data,
                    tabIndex: tabIndex,
                    triggerByTabBar: triggerByTabBar,
                },
            }));
        },
    })
);

export const useTab = () => {
    return useTabStore(
        useCallback(state => ({
            tabIndex: state.data.tabIndex,
            setTabIndex: state.setTabIndex,
            triggerByTabBar: state.data.triggerByTabBar
        }), [])
    );
};
