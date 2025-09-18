// FullPlayer.js

import React, {useEffect} from 'react';
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
import TrackPlayer, {State} from "react-native-track-player";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {Text} from "./Text";
import {useDarkMode} from "../hooks/DarkModeHooks";
import {storage} from "../storage";
import {initializeTrackPlayer} from "./PlayerBar";
import {PlayerProgress} from './PlayerProgress';
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

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// 自定义一个 Reanimated Modal
export const FullPlayer = ({isVisible, onClose}) => {
    const currentTrack = useTrack();
    const status = useTrackStatus();
    const insets = useSafeAreaInsets();
    const isDarkMode = useDarkMode();
    const {theme} = useTheme();
    const {setShowing, setTrack} = useTrackStateStore.getState();

    // 共享值，用于控制模态框的 translateY 位置
    const y = useSharedValue(SCREEN_HEIGHT);

    // 模态框显示/隐藏的动画
    useEffect(() => {
        if (isVisible) {
            y.value = withTiming(0, { duration: 300 });
        } else {
            y.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
        }
    }, [isVisible]);

    // 手势处理函数
    const onGestureEvent = useAnimatedGestureHandler({
        onStart: (event, ctx) => {
            ctx.startY = y.value;
        },
        onActive: (event, ctx) => {
            // 只在向下滑动时移动模态框
            if (event.translationY > 0) {
                y.value = ctx.startY + event.translationY;
            }
        },
        onEnd: (event, ctx) => {
            // 如果手势速度足够快或者滑动距离超过屏幕的 1/3，则收起模态框
            if (event.translationY > SCREEN_HEIGHT / 3 || event.velocityY > 500) {
                y.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
                    // 动画结束后，调用 onClose
                    runOnJS(onClose)();
                });
            } else {
                // 否则，弹回顶部
                y.value = withSpring(0, { tension: 150, friction: 8 });
            }
        },
    });

    // 模态框的动画样式
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: y.value }],
        };
    });

    var handlePlayPause = async () => {
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

    var handleClose = async () => {
        setShowing(false);
        storage.set('currentTrack', JSON.stringify({}));
        setTrack({});
        await TrackPlayer.reset();
        initializeTrackPlayer().then(() => console.log('clean track play.'));
        onClose();
    };

    var handleSeekBack = async () => {
        try {
            const playerProgress = await TrackPlayer.getProgress();
            var newPosition = Math.max(0, playerProgress.position - 15);
            await TrackPlayer.seekTo(newPosition);
        } catch (error) {
            console.warn('Seek back error:', error);
        }
    };

    var handleSeekForward = async () => {
        try {
            const playerProgress = await TrackPlayer.getProgress();
            var newPosition = Math.min(playerProgress.duration, playerProgress.position + 15);
            await TrackPlayer.seekTo(newPosition);
        } catch (error) {
            console.warn('Seek forward error:', error);
        }
    };

    var isPlaying = status === State.Playing;
    var isLoading = status === State.Loading || status === State.Buffering || status === undefined;

    return (
        // 使用 PanGestureHandler 替代 Modal
        <PanGestureHandler onGestureEvent={onGestureEvent}>
            <Animated.View
                style={[
                    styles.container,
                    {backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF', paddingTop: insets.top},
                    animatedStyle,
                    // 只有模态框可见时才显示
                    { display: isVisible ? 'flex' : 'none' }
                ]}
            >
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
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
                    </View>

                    <PlayerProgress />

                    <View style={styles.controlsContainer}>
                        <TouchableOpacity onPress={handleSeekBack} style={styles.controlButton}>
                            <Icon
                                name="play-skip-back"
                                type="ionicon"
                                size={28}
                                color={isDarkMode ? '#FFFFFF' : '#000000'}
                            />
                            <Text style={[styles.skipText, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}>15s</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handlePlayPause}
                            style={[styles.playButton, {backgroundColor: isDarkMode ? '#FFFFFF' : '#000000'}]}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="large" color={isDarkMode ? '#000000' : '#FFFFFF'}/>
                            ) : (
                                <Icon
                                    name={isPlaying ? 'pause' : 'play'}
                                    type="ionicon"
                                    size={40}
                                    color={isDarkMode ? '#000000' : '#FFFFFF'}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSeekForward} style={styles.controlButton}>
                            <Icon
                                name="play-skip-forward"
                                type="ionicon"
                                size={28}
                                color={isDarkMode ? '#FFFFFF' : '#000000'}
                            />
                            <Text style={[styles.skipText, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}>15s</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </PanGestureHandler>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        zIndex: 1000,
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
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 32,
    },
    artist: {
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center',
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    controlButton: {
        padding: 20,
        marginHorizontal: 20,
        alignItems: 'center',
    },
    skipText: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});