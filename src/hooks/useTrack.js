import {useCallback} from 'react';
import {useTrackStateStore} from '../store';

export const useTrackState = () => {
    return useTrackStateStore(useCallback(state => {
        return state.data?.track;
    }, []));
};