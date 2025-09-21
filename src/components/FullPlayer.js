import React, {useEffect, useState} from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import {useTrack, useTrackStatus, useTrackStateStore} from "../hooks/TrackHooks";
import {Icon, Slider, useTheme} from "@rneui/themed";
import TrackPlayer, {State, useProgress} from "react-native-track-player";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {Text} from "./Text";
import {useDarkMode} from "../hooks/DarkModeHooks";
import {storage} from "../storage";
import {initializeTrackPlayer} from "./PlayerBar";
import {
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import {BlurView} from "@react-native-community/blur";
import ForwardIcon from '../../assets/icons/forward_30.svg';
import BackwardIcon from '../../assets/icons/backward_15.svg';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export const FullPlayer = ({isVisible, onClose}) => {
    const currentTrack = useTrack();
    const status = useTrackStatus();
    const insets = useSafeAreaInsets();
    const isDarkMode = useDarkMode();
    const {theme} = useTheme();
    const {setShowing, setTrack} = useTrackStateStore.getState();
    const progress = useProgress(500);

    const y = useSharedValue(SCREEN_HEIGHT);

    const formatTime = (time) => {
        if (!time || isNaN(time)) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}年${month}月${day}日`;
    };

    useEffect(() => {
        if (isVisible) {
            y.value = withTiming(0, { duration: 300 });
        } else {
            y.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
        }
    }, [isVisible]);

    const onGestureEvent = useAnimatedGestureHandler({
        onStart: (event, ctx) => {
            ctx.startY = y.value;
        },
        onActive: (event, ctx) => {
            if (event.translationY > 0) {
                y.value = ctx.startY + event.translationY;
            }
        },
        onEnd: (event, ctx) => {
            if (event.translationY > SCREEN_HEIGHT / 3 || event.velocityY > 500) {
                y.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
                    runOnJS(onClose)();
                });
            } else {
                y.value = withSpring(0, { tension: 150, friction: 8 });
            }
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: y.value }],
        };
    });

    const handlePlayPause = async () => {
        try {
            const playerProgress = await TrackPlayer.getProgress();
            if (status === State.Playing) {
                await TrackPlayer.pause();
            } else {
                if (playerProgress.position >= playerProgress.duration) {
                    await TrackPlayer.seekTo(0);
                }
                await TrackPlayer.play();
            }
        } catch (error) {
            console.warn('Play/pause error:', error);
        }
    };

    const handleClose = async () => {
        console.log('handleClose: Starting cleanup...');
        
        setShowing(false);
        
        storage.delete('currentTrack');
        setTrack({});
        
        await TrackPlayer.reset();
        
        await initializeTrackPlayer();
        console.log('handleClose: Track player cleaned and reinitialized');
        
        onClose();
    };

    const handleSeekBack = async () => {
        try {
            const playerProgress = await TrackPlayer.getProgress();
            var newPosition = Math.max(0, playerProgress.position - 15);
            await TrackPlayer.seekTo(newPosition);
        } catch (error) {
            console.warn('Seek back error:', error);
        }
    };

    const handleSeekForward = async () => {
        try {
            const playerProgress = await TrackPlayer.getProgress();
            var newPosition = Math.min(playerProgress.duration, playerProgress.position + 30);
            await TrackPlayer.seekTo(newPosition);
        } catch (error) {
            console.warn('Seek forward error:', error);
        }
    };


    const isPlaying = status === State.Playing;
    const isLoading = status === State.Loading || status === State.Buffering || status === undefined;

    return (
        <>
            <Animated.View
                style={[
                    styles.backgroundContainer,
                    animatedStyle,
                    { backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0)' : 'rgba(255, 255, 255, 0.5)' }
                ]}
            >
                <BlurView
                    style={[StyleSheet.absoluteFill, {zIndex: 99999}]}
                    blurType={isDarkMode ? "dark" : "light"}
                    blurAmount={isDarkMode ? 20 : 30}
                />
            </Animated.View>
            <PanGestureHandler onGestureEvent={onGestureEvent}>
                <Animated.View
                    style={[
                        styles.container,
                        animatedStyle,
                        { display: isVisible ? 'flex' : 'none' }
                    ]}
                >
                    <View style={[styles.contentWrapper, {paddingTop: insets.top}]}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Icon
                                    name="chevron-down"
                                    type="ionicon"
                                    size={28}
                                    color={isDarkMode ? '#FFFFFF' : '#000000'}
                                />
                            </TouchableOpacity>
                            <View style={styles.spacer} />
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <Icon
                                    name="close"
                                    type="ionicon"
                                    size={24}
                                    color={isDarkMode ? '#FFFFFF' : '#000000'}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.contentContainer}>
                            <View style={styles.artworkContainer}>
                                {currentTrack?.artwork ? (
                                    <Image style={styles.artwork} source={{uri: currentTrack.artwork}}/>
                                ) : (
                                    <View style={[styles.artwork, styles.defaultArtwork]}>
                                        <TopsIcon width={120} height={120}/>
                                    </View>
                                )}
                            </View>

                            <View style={styles.trackInfo}>
                                {currentTrack?.date && (
                                    <Text
                                        style={[styles.timestamp, {color: isDarkMode ? '#888888' : '#999999'}]}
                                        numberOfLines={1}
                                    >
                                        {formatDate(currentTrack.date)}
                                    </Text>
                                )}
                                <Text
                                    style={[styles.title, {color: isDarkMode ? '#FFFFFF' : '#000000'}]}
                                    numberOfLines={2}
                                >
                                    {currentTrack?.title || 'Unknown Title'}
                                </Text>
                                <Text
                                    style={[styles.artist, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}
                                    numberOfLines={1}
                                >
                                    {currentTrack?.artist || 'Unknown Artist'}
                                </Text>
                                <View style={styles.progressSection}>
                                <View style={styles.progressContainer}>
                                    <Slider
                                        style={styles.progressSlider}
                                        minimumValue={0}
                                        maximumValue={progress.duration || 1}
                                        value={progress.position}
                                        onSlidingComplete={(value) => TrackPlayer.seekTo(value)}
                                        minimumTrackTintColor="#F76F00"
                                        maximumTrackTintColor={isDarkMode ? '#333333' : '#E5E5EA'}
                                        thumbStyle={[styles.sliderThumb, {backgroundColor: '#F76F00'}]}
                                        trackStyle={styles.sliderTrack}
                                    />
                                    <View style={styles.timeRow}>
                                        <Text style={[styles.timeText, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}>
                                            {formatTime(progress.position)}
                                        </Text>
                                        <Text style={[styles.timeText, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}>
                                            -{formatTime(Math.max(0, progress.duration - progress.position))}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            </View>

                            <View style={styles.controlsContainer}>
                                <TouchableOpacity onPress={handleSeekBack} style={styles.skipButton}>
                                    <BackwardIcon width={32} height={32}/>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handlePlayPause}
                                    style={[styles.playButton, {backgroundColor: isDarkMode ? '#FFFFFF' : theme.colors.darkPrimary}]}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="large" color={isDarkMode ? '#000000' : '#FFFFFF'}/>
                                    ) : (
                                        <Icon
                                            name={isPlaying ? 'pause' : 'play'}
                                            type="ionicon"
                                            size={32}
                                            color={isDarkMode ? '#000000' : '#FFFFFF'}
                                        />
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleSeekForward} style={styles.skipButton}>
                                    <ForwardIcon width={32} height={32}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </PanGestureHandler>

        </>
    );
};

const styles = StyleSheet.create({
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000
    },
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    contentWrapper: {
        flex: 1,
        backgroundColor: 'transparent',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    closeButton: {
        padding: 8,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spacer: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'space-between',
        paddingBottom: 60,
    },
    artworkContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    artwork: {
        width: SCREEN_WIDTH - 80,
        height: SCREEN_WIDTH - 80,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
    },
    defaultArtwork: {
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trackInfo: {
        marginBottom: 0,
    },
    timestamp: {
        fontSize: 14,
        fontWeight: '400',
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 8,
        lineHeight: 30,
    },
    artist: {
        fontSize: 16,
        fontWeight: '400',
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    skipButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
    },
    skipButtonInner: {
        width: 32,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    skipButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    skipIcon: {
        marginTop: 2,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    progressSection: {
        marginBottom: 40,
    },
    progressContainer: {
        paddingHorizontal: 0,
    },
    progressSlider: {
        width: '100%',
        height: 40,
    },
    sliderThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    sliderTrack: {
        height: 4,
        borderRadius: 2,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 14,
        fontWeight: '400',
    },
});