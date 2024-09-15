import {useCallback} from 'react';
import {useTrackStateStore} from '../AudioTrackStore';

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