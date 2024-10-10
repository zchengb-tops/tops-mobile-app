import {create} from 'zustand';

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
        setStatus: (status) => set((state) => ({
            data: {
                ...state.data,
                status: status
            },
        })),
    })
);