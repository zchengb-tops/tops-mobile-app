import React, {useEffect} from 'react';
import {ActivityIndicator, Dimensions, Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {useTrack, useTrackShowing, useTrackShrink, useTrackStatus} from "../hooks/TrackHooks";
import {Icon, Slider} from "@rneui/themed";
import TrackPlayer, {Capability, State, useProgress} from "react-native-track-player";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useVisibility} from "../providers/VisibilityProvider";
import {Directions, Gesture, GestureDetector} from "react-native-gesture-handler";
import Animated, {runOnJS, runOnUI, useAnimatedStyle, useSharedValue, withTiming} from "react-native-reanimated";
import {BlurView} from "./BlurView";
import {storage} from "../storage";
import {useTrackStateStore} from "../hooks/AudioTrackStore";
import {Text} from "./Text";
import {useDarkMode} from "../hooks/DarkModeHooks";

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
    const progress = useProgress(800);
    const currentTrack = useTrack();
    const showing = useTrackShowing();
    const status = useTrackStatus();
    const insets = useSafeAreaInsets();
    const {isPlayBarVisible} = useVisibility();
    const screenWidth = Dimensions.get('window').width;
    const isShrink = useTrackShrink();
    const position = useSharedValue(0);
    const isDarkMode = useDarkMode();
    
    const animatedPlayBarStyle = useAnimatedStyle(() => ({
        transform: [{translateX: position.value}],
    }));
    const animatedBlurStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isShrink ? 1 : 0, {duration: 200}),
    }));

    useEffect(() => {
        position.value = withTiming(isShrink ? screenWidth - 24 : 0, {duration: 300});
    }, [isShrink]);

    const setPlayerBarShowing = useTrackStateStore.getState().setShowing;
    const setTrack = useTrackStateStore.getState().setTrack;
    const setShrink = useTrackStateStore.getState().setShrink;

    const formatTime = (time) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);

        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');

        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }

    const hasPlayedComplete = () => {
        return progress.position >= progress.duration
    }

    const delayedSetIsShrink = (value, delay) => {
        setTimeout(() => {
            setShrink(value);
        }, delay);
    };

    const flingRightGesture = Gesture.Fling()
        .direction(Directions.RIGHT)
        .onStart((e) => {
            position.value = withTiming(screenWidth - 24, {duration: 300});
            runOnJS(delayedSetIsShrink)(true, 100);
        });

    const handleFlingLeft = () => {
        runOnUI(() => position.value = withTiming(0, {duration: 300}))();
        runOnJS(setShrink)(false);
    }

    const flingLeftGesture = Gesture.Fling()
        .direction(Directions.LEFT)
        .onStart(() => {
            position.value = withTiming(0, {duration: 300});
            runOnJS(setShrink)(false);
        });

    const cleanTrackPlay = async () => {
        setPlayerBarShowing(false);
        storage.set('currentTrack', JSON.stringify({}));
        setTrack({});
        await TrackPlayer.reset();
        initializeTrackPlayer().then(() => console.log('clean track play.'));
    }

    if (!isPlayBarVisible) return null;

    return (
        showing ?
            <GestureDetector gesture={Gesture.Exclusive(flingRightGesture, flingLeftGesture)}>
                <Animated.View
                    style={[styles.playerBarExternalWrapper, {bottom: 48 + insets.bottom}, animatedPlayBarStyle]}>
                    {
                        isShrink
                            ?
                            <Animated.View style={[styles.blurViewWrapper, animatedBlurStyle]}>
                                <TouchableOpacity onPress={handleFlingLeft} activeOpacity={0.9}>
                                    <BlurView
                                        style={[styles.blurView]}
                                        blurType={isDarkMode ? "light" : "dark"}
                                        blurAmount={3}
                                    >
                                        <Icon size={16}
                                              name='chevron-back-outline'
                                              type='ionicon'
                                              style={styles.shrinkIcon}
                                              color={'#fff'}/>
                                    </BlurView>
                                </TouchableOpacity>
                            </Animated.View>
                            :
                            <></>
                    }
                    <View
                        activeOpacity={1}
                        style={[styles.playerBarInternalWrapper, {backgroundColor: isShrink ? 'transparent' : isDarkMode ? '#2A2A2A' : '#F7F7F7'}]}>
                        <View style={styles.trackInfo}>
                            {
                                currentTrack?.artwork
                                    ?
                                    <Image style={styles.cover} source={{uri: currentTrack?.artwork}}/>
                                    :
                                    <TopsIcon width={40} height={40}/>
                            }

                            <View style={styles.trackTextInfo}>
                                <Text style={[styles.title, {color: isDarkMode ? '#FFFFFF' : '#464646'}]} numberOfLines={1}
                                      ellipsizeMode='tail'>{currentTrack?.title}</Text>
                                <Text style={[styles.author, {color: isDarkMode ? '#999999' : '#888888'}]} numberOfLines={1}
                                      ellipsizeMode='tail'>{currentTrack?.artist}</Text>
                            </View>
                        </View>
                        <View style={styles.controls}>
                            <Text style={{color: isDarkMode ? '#999999' : '#888888', width: 64, textAlign: 'center', fontSize: 12}}>
                                {
                                    formatTime(progress.position)
                                }
                            </Text>
                            <Slider
                                maximumTrackTintColor={isDarkMode ? "#666666" : "#D9D9D9"}
                                maximumValue={progress.duration}
                                minimumTrackTintColor={isDarkMode ? "#FFFFFF" : "#464646"}
                                step={1}
                                style={{
                                    height: 18,
                                    marginLeft: 8,
                                    marginRight: 8,
                                    width: 150,
                                }}
                                trackStyle={{height: 6}}
                                thumbStyle={{height: 6, width: 6}}
                                thumbTintColor={isDarkMode ? "#FFFFFF" : "#464646"}
                                value={progress.position}
                                onSlidingComplete={(value) => TrackPlayer.seekTo(value)}
                            />
                            <Text style={{color: isDarkMode ? '#999999' : '#888888', width: 70, textAlign: 'center', fontSize: 12}}>
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
                                                    color={isDarkMode ? '#FFFFFF' : '#464646'}
                                                />
                                            </TouchableOpacity>
                                        ) : (
                                            status === State.Loading
                                                ?
                                                <ActivityIndicator size="small" color={isDarkMode ? '#FFFFFF' : '#464646'}/>
                                                :
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (hasPlayedComplete()) {
                                                            TrackPlayer.seekTo(0);
                                                        }
                                                        TrackPlayer.play();
                                                    }}>
                                                    <Icon
                                                        size={20}
                                                        name='play'
                                                        type='ionicon'
                                                        color={isDarkMode ? '#FFFFFF' : '#464646'}
                                                    />
                                                </TouchableOpacity>
                                        )}
                                        <TouchableOpacity style={styles.closeButton}
                                                          onPress={cleanTrackPlay}>
                                            <Icon
                                                size={20}
                                                name='close-circle'
                                                type='ionicon'
                                                color={isDarkMode ? '#FFFFFF' : '#464646'}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    : <></>
                            }
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>
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
    },
    author: {
        fontSize: 12,
        marginTop: 6
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 8,
    },
    closeButton: {
        marginLeft: 8
    },
    gradient: {
        position: 'absolute',
        width: 24,
        height: '100%',
        left: 12,
    },
    blurViewWrapper: {
        zIndex: 10,
        position: 'absolute',
        width: 24,
        height: '100%',
        left: 8,
    },
    blurView: {
        height: '100%',
        borderRadius: 6,
        justifyContent: 'center',
    },
    shrinkIcon: {
        transform: [
            {translateX: -3}
        ]
    }
});
