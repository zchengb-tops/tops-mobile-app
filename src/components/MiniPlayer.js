import React, {useEffect, useRef} from 'react';
import {StyleSheet, Image, ActivityIndicator, Easing, View, Dimensions, Platform} from 'react-native';
import {useTrack, useTrackStatus} from "../hooks/TrackHooks";
import {State, useProgress} from "react-native-track-player";
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {PanGestureHandler} from 'react-native-gesture-handler';
import {TouchableOpacity} from 'react-native';
import {
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring, 
    withTiming,
    withRepeat,
    cancelAnimation
} from "react-native-reanimated";
import Animated from 'react-native-reanimated';
import {Animated as ReactNativeAnimated} from 'react-native';


export const MiniPlayer = ({onPress}) => {
    const currentTrack = useTrack();
    const status = useTrackStatus();
    const progress = useProgress(1000);
    const insets = useSafeAreaInsets();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    const initialPositionX = screenWidth - 80;
    const initialPositionY = screenHeight - 160 - insets.bottom;

    const x = useSharedValue(initialPositionX);
    const y = useSharedValue(initialPositionY);

    const isDragging = useSharedValue(false);
    const isDraggingRef = useRef(false);

    const isExpanded = useRef(false);
    const expandAnimation = useSharedValue(0);

    const rotationValue = useSharedValue(0);

    if (!currentTrack?.title) return null;

    console.log('MiniPlayer is rendering...');


    var isLoading = status === State.Loading || status === State.Buffering || status === undefined;
    var isPlaying = status === State.Playing;
    var progressPercent = progress.duration > 0 ? (progress.position / progress.duration) * 100 : 0;

    const expandPlayer = () => {
        if (!isExpanded.current) {
            isExpanded.current = true;
            expandAnimation.value = withSpring(1, {tension: 150, friction: 8});
        }
    };

    const collapsePlayer = () => {
        if (isExpanded.current) {
            isExpanded.current = false;
            expandAnimation.value = withSpring(0, {tension: 150, friction: 8});
        }
    };

    const collapseTimer = useRef(null);
    const resetCollapseTimer = () => {
        if (collapseTimer.current) {
            clearTimeout(collapseTimer.current);
        }
        collapseTimer.current = setTimeout(() => {
            collapsePlayer();
        }, 5000);
    };

    useEffect(() => {
        if (isPlaying) {
            // Start continuous rotation animation
            rotationValue.value = withRepeat(
                withTiming(360, {
                    duration: 8000,
                }),
                -1, // Infinite repeats
                false // Don't reverse
            );
        } else {
            // Cancel the rotation animation when paused
            cancelAnimation(rotationValue);
        }
    }, [isPlaying]);

    useEffect(() => {
        resetCollapseTimer();
        return () => {
            if (collapseTimer.current) {
                clearTimeout(collapseTimer.current);
            }
        };
    }, []);

    const onGestureEvent = useAnimatedGestureHandler({
        onStart: (event, ctx) => {
            ctx.offsetX = x.value;
            ctx.offsetY = y.value;
            isDragging.value = true;
        },
        onActive: (event, ctx) => {
            const newX = ctx.offsetX + event.translationX;
            const newY = ctx.offsetY + event.translationY;

            const minMarginLeft = 0;
            const minMarginRight = 80;
            const minHeight = insets.top + 80;
            const maxHeight = screenHeight - 150 - insets.bottom;

            x.value = Math.max(minMarginLeft, Math.min(screenWidth - minMarginRight, newX));
            y.value = Math.max(minHeight, Math.min(maxHeight, newY));

            runOnJS(expandPlayer)();
            runOnJS(resetCollapseTimer)();
        },
        onEnd: (event, ctx) => {
            // Snap to the closest edge based on current position
            const targetX = x.value < screenWidth / 2 ? 0 : screenWidth - 80;
            x.value = withSpring(targetX, {tension: 100, friction: 8});

            isDragging.value = false;
            runOnJS(resetCollapseTimer)();
        },
    });


    const animatedStyle = useAnimatedStyle(() => {
        // Determine which side the mini-player is on
        const isOnLeftSide = x.value < screenWidth / 2;
        
        // Calculate the collapse offset based on which side it's on
        const collapseOffset = isOnLeftSide ? -50 : 50; // Left side: move left, Right side: move right
        
        const translateX = expandAnimation.value === 0
            ? withTiming(collapseOffset, {duration: 300})
            : withTiming(0, {duration: 300});

        return {
            transform: [
                {translateX: x.value},
                {translateY: y.value},
                {translateX: translateX},
            ],
            opacity: withTiming(expandAnimation.value === 0 ? 0.7 : 1, {duration: 300}),
        };
    });

    const rotationAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                rotate: `${rotationValue.value}deg`
            }]
        };
    });

    const handlePress = () => {
        if (!isDraggingRef.current) {
            if (!isExpanded.current) {
                expandPlayer();
                resetCollapseTimer();
                console.log('Mini-player expanded');
            } else {
                console.log('Mini-player pressed - opening full player');
                onPress && onPress();
            }
        }
    };


    return (
        <PanGestureHandler onGestureEvent={onGestureEvent}>
            <Animated.View
                style={[
                    styles.container,
                    animatedStyle
                ]}
            >
                <TouchableOpacity
                    onPress={handlePress}
                    style={styles.touchableArea}
                    activeOpacity={0.8}
                >
                    <View style={styles.progressContainer}>
                        <AnimatedCircularProgress
                            size={64}
                            width={2}
                            fill={Math.min(100, Math.max(0, progressPercent))}
                            tintColor="#F76F00"
                            backgroundColor="rgba(255, 255, 255, 0.4)"
                            rotation={0}
                            lineCap="round"
                            style={styles.progressRing}
                        >
                            {() => (
                                <Animated.View
                                    style={[
                                        styles.avatarContainer,
                                        rotationAnimatedStyle
                                    ]}
                                >
                                    {currentTrack?.artwork ? (
                                        <Image style={styles.avatar} source={{uri: currentTrack.artwork}}/>
                                    ) : (
                                        <TopsIcon width={36} height={36}/>
                                    )}
                                    {isLoading && (
                                        <ActivityIndicator
                                            style={styles.loadingIndicator}
                                            size="small"
                                            color="#FFFFFF"
                                        />
                                    )}
                                </Animated.View>
                            )}
                        </AnimatedCircularProgress>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </PanGestureHandler>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 9,
        elevation: 9999,
    },
    touchableArea: {
        padding: 8,
        borderRadius: 40,
        opacity: 0.8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
        }),
    },
    progressContainer: {
        position: 'relative',
    },
    avatarContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressRing: {
        position: 'absolute',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 0,
    },
    loadingIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
