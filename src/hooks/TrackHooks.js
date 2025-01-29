import {useCallback} from 'react';
import {create} from "zustand";

export const useTrackStateStore = create(
    (set) => ({
        data: {},
        setProgress: (progress) => set((state) => ({
            data: {
                ...state.data,
                position: progress,
            },
        })),
        setTrack: (track) => set((state) => ({
            data: {
                ...state.data,
                track: track,
            },
        })),
        setShowing: (showing = true) => set((state) => ({
            data: {
                ...state.data,
                showing: showing,
            },
        })),
        setShrink: (shrink = false) => set((state) => ({
            data: {
                ...state.data,
                shrink: shrink,
            },
        })),
        setStatus: (status) => set((state) => ({
            data: {
                ...state.data,
                status: status
            },
        })),
    })
);

export const useTrackProgress = () => {
    return useTrackStateStore(useCallback(state => {
        return state.data?.position || 0;
    }, []));
};

export const useTrack = () => {
    return useTrackStateStore(useCallback(state => {
        return state.data?.track;
    }, []));
};

export const useTrackShowing = () => {
    return useTrackStateStore(useCallback(state => {
        return state.data?.showing;
    }, []));
};

export const useTrackStatus = () => {
    return useTrackStateStore(useCallback(state => {
        return state.data?.status;
    }, []));
};

export const useTrackShrink = () => {
    return useTrackStateStore(useCallback(state => {
        return state.data?.shrink;
    }, []));
};