import React from 'react';
import {ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {useTrack, useTrackProgress, useTrackShowing, useTrackStatus} from "../hooks/TrackHooks";
import {Icon} from "@rneui/themed";
import TrackPlayer, {State} from "react-native-track-player";

export const PlayerBar = () => {
    const position = useTrackProgress();
    const currentTrack = useTrack();
    const showing = useTrackShowing();
    const status = useTrackStatus();

    return (
        showing ?
            <View style={styles.playerBar}>
                <View style={styles.trackInfo}>
                    {
                        currentTrack?.artwork
                            ?
                            <Image style={styles.cover} source={{uri: currentTrack?.artwork}}/>
                            :
                            <TopsIcon width={32} height={32}/>
                    }

                    <View style={styles.trackTextInfo}>
                        <Text style={styles.title} numberOfLines={1} ellipsizeMode='tail'>{currentTrack?.title}</Text>
                        <Text style={styles.author} numberOfLines={1}
                              ellipsizeMode='tail'>{currentTrack?.artist}</Text>
                    </View>
                </View>
                {
                    currentTrack ?
                        <View style={styles.controls}>
                            {status === State.Playing ? (
                                <TouchableOpacity onPress={() => {
                                    TrackPlayer.pause();
                                }}>
                                    <Icon
                                        size={20}
                                        name='pause'
                                        type='ionicon'
                                        color='#464646'
                                    />
                                </TouchableOpacity>
                            ) : (
                                status === State.Loading || status === State.Buffering || status === State.Ready
                                    ?
                                    <ActivityIndicator size="small" color={'#464646'}/>
                                    :
                                    <TouchableOpacity onPress={() => {
                                        TrackPlayer.play();
                                    }}>
                                        <Icon
                                            size={20}
                                            name='play'
                                            type='ionicon'
                                            color='#464646'
                                        />
                                    </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.playForward} onPress={() => {
                                TrackPlayer.getProgress().then((progress) => {
                                    let newPosition = progress.position + 15;
                                    newPosition = newPosition > progress.duration ? progress.duration : newPosition;
                                    TrackPlayer.seekTo(newPosition);
                                })
                            }}>
                                <Icon
                                    size={20}
                                    name='play-forward'
                                    type='ionicon'
                                    color='#464646'
                                />
                            </TouchableOpacity>
                        </View>
                        : <></>
                }
            </View>
            : <></>
    );
};

const styles = StyleSheet.create({
    playerBar: {
        width: '100%',
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopColor: '#ddd',
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
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
    trackTextInfo: {
        marginLeft: 12
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
    },
    author: {
        color: '#939393',
        fontSize: 14,
        marginTop: 4
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    playForward: {
        marginLeft: 12
    }
});
