import TrackPlayer, {Event} from 'react-native-track-player';
import {useTrackStateStore} from '../store';

const setProgress = useTrackStateStore.getState().setProgress;
const setStatus = useTrackStateStore.getState().setStatus;

export const PlaybackService = async function () {
    TrackPlayer.addEventListener(Event.PlaybackState, ({state}) => {
        setStatus(state);
    });

    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async ({position, track: trackIndex}) => {
        setProgress(position);
    });
};