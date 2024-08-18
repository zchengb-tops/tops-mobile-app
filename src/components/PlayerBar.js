import React, {useEffect} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import PlayIcon from '../../assets/icons/play.svg';
import {useTrackProgressState} from "../hooks/useTrackProgress";
import {useTrackState} from "../hooks/useTrack";
import {Icon} from "@rneui/themed";

export const PlayerBar = () => {
    const position = useTrackProgressState();
    const currentTrack = useTrackState();

    useEffect(() => {
        console.log('currentTrack.artwork', currentTrack)
    }, [])

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
        currentTrack ?
            <View style={styles.playerBar}>
                <View style={styles.trackInfo}>
                    <Image style={styles.cover} source={{uri: currentTrack.artwork}}/>
                    <Text style={styles.title} ellipsizeMode='tail' numberOfLines={1}>{currentTrack.title}</Text>
                </View>
                <View style={styles.controls}>
                    <TouchableOpacity>
                        {currentTrack ? (
                            <Icon
                                size={20}
                                name='pause'
                                type='ionicon'
                                color='#464646'
                            />
                        ) : (
                            <PlayIcon width={32} height={32}/>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={{marginLeft: 12}}>
                        <Icon
                            size={20}
                            name='play-forward'
                            type='ionicon'
                            color='#464646'
                        />
                    </TouchableOpacity>
                </View>
            </View>
            : <></>
    );
};

const styles = StyleSheet.create({
    playerBar: {
        // position: 'absolute',
        // bottom: 0,
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
        borderRadius: 4
    },
    trackInfo: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        maxWidth: '75%',
    },
    title: {
        fontSize: 14,
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
