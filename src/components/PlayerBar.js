import React from 'react';
import {ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {useTrack, useTrackShowing, useTrackStatus} from "../hooks/TrackHooks";
import {Icon, Slider} from "@rneui/themed";
import TrackPlayer, {State, useProgress} from "react-native-track-player";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useVisibility} from "../../utils/VisibilityProvider";

export const PlayerBar = () => {
    const progress = useProgress(800);

    const currentTrack = useTrack();
    const showing = useTrackShowing();
    const status = useTrackStatus();
    const insets = useSafeAreaInsets();
    const {isVisible} = useVisibility();

    const formatTime = (time) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);

        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');

        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }

    if (!isVisible) return null;

    return (
        showing ?
            <View style={[styles.playerBarExternalWrapper, {bottom: 48 + insets.bottom}]}>
                <View style={styles.playerBarInternalWrapper}>
                    <View style={styles.trackInfo}>
                        {
                            currentTrack?.artwork
                                ?
                                <Image style={styles.cover} source={{uri: currentTrack?.artwork}}/>
                                :
                                <TopsIcon width={40} height={40}/>
                        }

                        <View style={styles.trackTextInfo}>
                            <Text style={styles.title} numberOfLines={1}
                                  ellipsizeMode='tail'>{currentTrack?.title}</Text>
                            <Text style={styles.author} numberOfLines={1}
                                  ellipsizeMode='tail'>{currentTrack?.artist}</Text>
                        </View>
                    </View>
                    <View style={styles.controls}>
                        <Text style={{color: '#888888', width: 64, textAlign: 'center', fontSize: 12}}>
                            {
                                formatTime(progress.position)
                            }
                        </Text>
                        <Slider
                            maximumTrackTintColor={"#D9D9D9"}
                            maximumValue={progress.duration}
                            minimumTrackTintColor={"#464646"}
                            step={1}
                            style={{
                                height: 18,
                                marginLeft: 8,
                                marginRight: 8,
                                width: 150,
                            }}
                            trackStyle={{height: 6}}
                            thumbStyle={{height: 6, width: 6}}
                            thumbTintColor="#464646"
                            value={progress.position}
                            onSlidingComplete={(value) => TrackPlayer.seekTo(value)}
                        />
                        <Text style={{color: '#888888', width: 70, textAlign: 'center', fontSize: 12}}>
                            -{formatTime(progress.duration - progress.position)}
                        </Text>
                        {
                            currentTrack ?
                                <View style={{flexDirection: 'row', marginLeft: 12}}>
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
                                        status === State.Loading
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
                </View>
            </View>
            : <></>
    );
};

const styles = StyleSheet.create({
    playerBarExternalWrapper: {
        position: 'absolute',
        zIndex: 1,
        width: '100%',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: {width: -4, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 8.84,
    },
    playerBarInternalWrapper: {
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 8,
        width: '100%',
    },
    cover: {
        width: 40,
        height: 40,
        borderRadius: 4
    },
    trackInfo: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
    },
    trackTextInfo: {
        width: '100%',
        marginLeft: 12,
        flex: 1
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        color: '#464646'
    },
    author: {
        color: '#888888',
        fontSize: 12,
        marginTop: 6
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 8,
    },
    playForward: {
        marginLeft: 8
    }
});
