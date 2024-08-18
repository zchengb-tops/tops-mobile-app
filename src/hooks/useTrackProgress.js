import {useCallback} from 'react';
import {useTrackStateStore} from '../store';

export const useTrackProgressState = () => {
    return useTrackStateStore(useCallback(state => {
        console.log('i am in useTrackStateStore', state.data);
        return state.data?.position || 0;
    }, []));
};