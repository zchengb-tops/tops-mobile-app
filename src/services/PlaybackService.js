import TrackPlayer, {Event} from 'react-native-track-player';
import {useTrackStateStore} from '../store';

const setProgress = useTrackStateStore.getState().setProgress;
const setTrack = useTrackStateStore.getState().setTrack;

export const PlaybackService = async function () {
    TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async ({position, track: trackIndex}) => {
        console.log('PlaybackProgressUpdated:', position, trackIndex);
        // get the track to fetch your unique ID property (if applicable)
        const track = await TrackPlayer.getTrack(trackIndex);
        // write progress to the zustand store
        setProgress(position);
        setTrack(track);
    });
};