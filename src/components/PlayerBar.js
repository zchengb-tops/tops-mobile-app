import React, {useState, useEffect} from 'react';
import TrackPlayer, {Capability} from "react-native-track-player";
import {useTrack, useTrackShowing} from "../hooks/TrackHooks";
import {useVisibility} from "../providers/VisibilityProvider";
import {MiniPlayer} from "./MiniPlayer";
import {FullPlayer} from "./FullPlayer";

export const initializeTrackPlayer = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
        progressUpdateEventInterval: 1,
        stopWithApp: true,
        capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.JumpForward,
            Capability.JumpBackward,
            Capability.SeekTo
        ],
        compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.JumpForward,
            Capability.JumpBackward
        ],
        notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.JumpForward,
            Capability.JumpBackward,
            Capability.SeekTo
        ],
        androidCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.JumpForward,
            Capability.JumpBackward
        ],
    });
    console.log('initialize track player done');
}

export const PlayerBar = () => {
    const currentTrack = useTrack();
    const showing = useTrackShowing();
    const {isPlayBarVisible} = useVisibility();
    const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
    
    const showFullPlayer = () => setIsFullPlayerVisible(true);
    const hideFullPlayer = () => setIsFullPlayerVisible(false);
    
    if (!isPlayBarVisible || !showing || !currentTrack?.title) {
        return null;
    }

    return (
        <>
            <MiniPlayer onPress={showFullPlayer} />
            <FullPlayer 
                isVisible={isFullPlayerVisible} 
                onClose={hideFullPlayer} 
            />
        </>
    );
};