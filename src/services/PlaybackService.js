import TrackPlayer, {Event, State} from 'react-native-track-player';
import {useTrackStateStore} from '../store';

const setProgress = useTrackStateStore.getState().setProgress;
const setStatus = useTrackStateStore.getState().setStatus;

export const PlaybackService = async function () {
    TrackPlayer.addEventListener(Event.PlaybackState, ({state}) => {
        if (state === State.Ready || state === State.Buffering) {
            return;
        }

        setStatus(state);
    });

    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async ({position, track: trackIndex}) => {
        setProgress(position);
    });
};