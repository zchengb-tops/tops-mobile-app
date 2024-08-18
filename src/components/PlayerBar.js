import React, {useEffect} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import PlayIcon from '../../assets/icons/play.svg';
import PauseIcon from '../../assets/icons/pause.svg';
import {useTrackProgressState} from "../hooks/useTrackProgress";

export const PlayerBar = ({isShowing, isPlaying, onPlayPause, onForward, onBackward, currentTrack}) => {
    const position = useTrackProgressState();

    useEffect(() => {
        console.log('currentTrack.artwork', currentTrack)
    }, [])

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
        isShowing ?
            <View style={styles.playerBar}>
                <View style={styles.trackInfo}>
                    <Image style={styles.cover} source={{uri: currentTrack.coverUrl}}/>
                    <Text style={styles.title} ellipsizeMode='tail' numberOfLines={1}>{currentTrack.title}</Text>
                </View>
                <View style={styles.controls}>
                    <TouchableOpacity onPress={onPlayPause}>
                        {isPlaying ? (
                            <PauseIcon width={32} height={32}/>
                        ) : (
                            <PlayIcon width={32} height={32}/>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
            : <></>
    );
};

const styles = StyleSheet.create({
    playerBar: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 48,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopColor: '#ddd',
        borderTopWidth: 1,
        paddingHorizontal: 16,
    },
    cover: {
        width: 32,
        height: 32,
        borderRadius: 24
    },
    trackInfo: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        maxWidth: '75%',
    },
    title: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 8
    },
    slider: {
        flex: 1,
        marginHorizontal: 10,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
});
