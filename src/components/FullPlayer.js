import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Platform
} from 'react-native';
import {useTrack, useTrackStatus, useTrackStateStore, useFullPlayerVisible} from "../hooks/TrackHooks";
import {Icon, Slider} from "@rneui/themed";
import TrackPlayer, {State, useProgress} from "react-native-track-player";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {Text} from "./Text";
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
import {PanGestureHandler} from 'react-native-gesture-handler';
import {BlurView} from "@react-native-community/blur";
import ForwardIcon from '../../assets/icons/forward_30.svg';
import BackwardIcon from '../../assets/icons/backward_15.svg';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export const FullPlayer = ({isVisible, onClose}) => {
    const currentTrack = useTrack();
    const status = useTrackStatus();
    const insets = useSafeAreaInsets();
    const {setShowing, setTrack, setFullPlayerVisible} = useTrackStateStore.getState();
    const progress = useProgress(500);
    const [dominantColor, setDominantColor] = useState('#1C1C1E');
    const [isSliding, setIsSliding] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [sliderValue, setSliderValue] = useState(0);
    const animationFrameRef = useRef(null);
    const pendingValueRef = useRef(null);
    const expectedSeekPositionRef = useRef(null);
    const seekTimeoutRef = useRef(null);

    const y = useSharedValue(SCREEN_HEIGHT);
    const artworkScale = useSharedValue(1);
    const sliderThumbScale = useSharedValue(1);
    const sliderHeightScale = useSharedValue(1);
    const tooltipOpacity = useSharedValue(0);
    const tooltipY = useSharedValue(0);
    const tooltipX = useSharedValue(0);

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

    const calculateTooltipPosition = (currentValue, maxValue) => {
        if (!maxValue || maxValue === 0) return 0;
        
        // Calculate percentage of progress (0 to 1)
        const percentage = Math.max(0, Math.min(1, currentValue / maxValue));
        
        // Slider width calculation (accounting for padding)
        const sliderWidth = SCREEN_WIDTH - 64; // 32px padding on each side
        const tooltipWidth = 60; // Approximate tooltip width
        
        // Calculate position, ensuring tooltip stays within bounds
        const rawPosition = (percentage * sliderWidth) - (sliderWidth / 2);
        const minPosition = -(sliderWidth / 2) + (tooltipWidth / 2);
        const maxPosition = (sliderWidth / 2) - (tooltipWidth / 2);
        
        return Math.max(minPosition, Math.min(maxPosition, rawPosition));
    };

    useEffect(() => {
        if (isVisible) {
            y.value = withTiming(0, {duration: 300});
        } else {
            y.value = withTiming(SCREEN_HEIGHT, {duration: 300});
        }
    }, [isVisible]);

    useEffect(() => {
        const isPlaying = status === State.Playing;
        artworkScale.value = withSpring(isPlaying ? 1 : 0.8, {
            damping: 80,
            stiffness: 150,
            mass: 1,
            overshootClamping: false,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
        });
    }, [status]);

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
                y.value = withTiming(SCREEN_HEIGHT, {duration: 250}, () => {
                    runOnJS(onClose)();
                });
            } else {
                y.value = withSpring(0, {tension: 150, friction: 8});
            }
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{translateY: y.value}],
        };
    });

    const artworkAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{scale: artworkScale.value}],
        };
    });

    const sliderThumbAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {scaleX: sliderThumbScale.value},
                {scaleY: sliderHeightScale.value}
            ],
        };
    });

    const tooltipAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: tooltipOpacity.value,
            transform: [
                {translateX: tooltipX.value},
                {translateY: tooltipY.value},
                {scale: tooltipOpacity.value}
            ],
        };
    });

    const extractDominantColor = async (imageUri) => {
        try {
            // For now, we'll use a simple approach with predefined dark colors
            // In a real implementation, you might want to use a library like react-native-image-colors
            const darkColors = [
                '#1C1C1E', '#2C2C2E', '#3A3A3C', '#48484A', '#636366',
                '#1A1A2E', '#16213E', '#0F3460', '#533A71', '#6A4C93',
                '#2D1B69', '#11009E', '#4E0E4E', '#2E0249', '#3C096C'
            ];
            const randomColor = darkColors[Math.floor(Math.random() * darkColors.length)];
            setDominantColor(randomColor);
        } catch (error) {
            console.warn('Error extracting color:', error);
            setDominantColor('#1C1C1E');
        }
    };

    useEffect(() => {
        if (currentTrack?.artwork) {
            extractDominantColor(currentTrack.artwork);
        }
    }, [currentTrack?.artwork]);

    useEffect(() => {
        if (!isSliding && !isSeeking) {
            setSliderValue(progress.position);
        } else if (isSeeking && expectedSeekPositionRef.current !== null) {
            // During seeking, validate if the progress position matches our expected seek position
            const expectedPosition = expectedSeekPositionRef.current;
            const actualPosition = progress.position;
            // Adaptive tolerance: 0.5s for short tracks, up to 2s for very long tracks
            const tolerance = Math.min(2, Math.max(0.5, progress.duration * 0.001));
            
            // If the actual position is close to our expected position, the seek has completed
            if (Math.abs(actualPosition - expectedPosition) < tolerance) {
                setSliderValue(actualPosition);
                expectedSeekPositionRef.current = null;
                setIsSeeking(false);
                setIsSliding(false);
                
                // Clear any pending timeout
                if (seekTimeoutRef.current) {
                    clearTimeout(seekTimeoutRef.current);
                    seekTimeoutRef.current = null;
                }
            }
        }
    }, [progress.position, isSliding, isSeeking]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
            }
        };
    }, []);

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
        setFullPlayerVisible(false);

        // Stop the player and reset position
        await TrackPlayer.pause();
        await TrackPlayer.seekTo(0);
        
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

    const handleSlidingStart = useCallback(() => {
        setIsSliding(true);
        
        // Enhanced zoom animation - scale both width and height
        sliderThumbScale.value = withSpring(1.1, {
            damping: 15,
            stiffness: 150,
            mass: 0.8
        });
        sliderHeightScale.value = withSpring(1.8, {
            damping: 15,
            stiffness: 150,
            mass: 0.8
        });
        
        // Show tooltip with animation
        tooltipOpacity.value = withSpring(1, {
            damping: 20,
            stiffness: 300,
        });
        tooltipY.value = withSpring(-10, {
            damping: 20,
            stiffness: 300,
        });
        
        // Set initial tooltip position
        const initialPosition = calculateTooltipPosition(progress.position, progress.duration);
        tooltipX.value = withSpring(initialPosition, {
            damping: 20,
            stiffness: 300,
        });
    }, []);

    const handleSlidingComplete = useCallback(async (value) => {
        try {
            setIsSeeking(true);
            expectedSeekPositionRef.current = value;
            
            await TrackPlayer.seekTo(value);
            
            // Set a fallback timeout in case the position validation doesn't work
            seekTimeoutRef.current = setTimeout(() => {
                if (expectedSeekPositionRef.current !== null) {
                    expectedSeekPositionRef.current = null;
                    setIsSeeking(false);
                    setIsSliding(false);
                }
            }, 500); // Longer timeout as fallback
            
            // Reset zoom animation
            sliderThumbScale.value = withSpring(1, {
                damping: 15,
                stiffness: 150,
                mass: 0.8
            });
            sliderHeightScale.value = withSpring(1, {
                damping: 15,
                stiffness: 150,
                mass: 0.8
            });
            
            // Hide tooltip with animation
            tooltipOpacity.value = withSpring(0, {
                damping: 20,
                stiffness: 300,
            });
            tooltipY.value = withSpring(0, {
                damping: 20,
                stiffness: 300,
            });
            tooltipX.value = withSpring(0, {
                damping: 20,
                stiffness: 300,
            });
        } catch (error) {
            console.warn('Seek error:', error);
            expectedSeekPositionRef.current = null;
            setIsSeeking(false);
            setIsSliding(false);
            sliderThumbScale.value = withSpring(1);
            sliderHeightScale.value = withSpring(1);
            
            // Hide tooltip on error
            tooltipOpacity.value = withSpring(0);
            tooltipY.value = withSpring(0);
            tooltipX.value = withSpring(0);
            
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
                seekTimeoutRef.current = null;
            }
        }
    }, []);

    const handleValueChange = useCallback((value) => {
        if (isSliding) {
            pendingValueRef.current = value;
            
            // Update tooltip position based on current drag value
            const newPosition = calculateTooltipPosition(value, progress.duration);
            tooltipX.value = newPosition;
            
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            
            animationFrameRef.current = requestAnimationFrame(() => {
                if (pendingValueRef.current !== null) {
                    setSliderValue(pendingValueRef.current);
                    pendingValueRef.current = null;
                }
            });
        }
    }, [isSliding, progress.duration]);


    const isPlaying = status === State.Playing;
    // Don't show loading during seek operations, but show for genuine loading/buffering
    const isLoading = (status === State.Loading || 
                      (status === State.Buffering && !isSliding && !isSeeking) || 
                      status === undefined) && !isSliding && !isSeeking;

    return (
        <>
            {isVisible && (
                <StatusBar
                    barStyle="light-content"
                    backgroundColor="transparent"
                    translucent={true}
                />
            )}
            <Animated.View
                style={[
                    styles.backgroundContainer,
                    animatedStyle,
                    {
                        backgroundColor: dominantColor + '80',
                        zIndex: Platform.OS === 'ios' ? 1000 : (isVisible ? 100 : 0),
                    }
                ]}
            >
                <BlurView
                    style={[StyleSheet.absoluteFill, {zIndex: 1}]}
                    blurType="dark"
                    blurAmount={Platform.OS === 'ios' ? 20 : 50}
                />
            </Animated.View>
            <PanGestureHandler onGestureEvent={onGestureEvent}>
                <Animated.View
                    style={[
                        styles.container,
                        animatedStyle,
                        {display: isVisible ? 'flex' : 'none'}
                    ]}
                >
                    <View style={[styles.contentWrapper, {paddingTop: insets.top}]}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Icon
                                    name="chevron-down"
                                    type="ionicon"
                                    size={28}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>
                            <View style={styles.spacer}/>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <Icon
                                    name="close"
                                    type="ionicon"
                                    size={24}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.contentContainer}>
                            <View style={styles.artworkContainer}>
                                <Animated.View style={artworkAnimatedStyle}>
                                    {currentTrack?.artwork ? (
                                        <Image style={styles.artwork} source={{uri: currentTrack.artwork}}/>
                                    ) : (
                                        <View style={[styles.artwork, styles.defaultArtwork]}>
                                            <TopsIcon width={120} height={120}/>
                                        </View>
                                    )}
                                </Animated.View>
                            </View>

                            <View style={styles.trackInfo}>
                                {currentTrack?.date && (
                                    <Text
                                        style={[styles.timestamp, {color: 'rgba(255, 255, 255, 0.6)'}]}
                                        numberOfLines={1}
                                    >
                                        {formatDate(currentTrack.date)}
                                    </Text>
                                )}
                                <Text
                                    style={[styles.title, {color: '#FFFFFF'}]}
                                    numberOfLines={2}
                                >
                                    {currentTrack?.title || 'Unknown Title'}
                                </Text>
                                <Text
                                    style={[styles.artist, {color: 'rgba(255, 255, 255, 0.8)'}]}
                                    numberOfLines={1}
                                >
                                    {currentTrack?.artist || 'Unknown Artist'}
                                </Text>
                                <View style={styles.progressSection}>
                                    <View style={styles.progressContainer}>
                                        <Animated.View style={[styles.tooltip, tooltipAnimatedStyle]}>
                                            <Text style={styles.tooltipText}>
                                                {formatTime((isSliding || isSeeking) ? sliderValue : progress.position)}
                                            </Text>
                                            <View style={styles.tooltipArrow} />
                                        </Animated.View>
                                         <Animated.View style={sliderThumbAnimatedStyle}>
                                              <Slider
                                                  style={styles.progressSlider}
                                                  minimumValue={0}
                                                  maximumValue={progress.duration || 1}
                                                  value={sliderValue}
                                                  onSlidingStart={handleSlidingStart}
                                                  onValueChange={handleValueChange}
                                                  onSlidingComplete={handleSlidingComplete}
                                                  minimumTrackTintColor="rgba(255, 255, 255, 0.9)"
                                                  maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                                                  thumbStyle={styles.sliderThumb}
                                                  trackStyle={styles.sliderTrack}
                                                  thumbProps={{
                                                     children: () => {return <></>}
                                                 }}
                                              />
                                         </Animated.View>
                                        <View style={styles.timeRow}>
                                            <Text style={[styles.timeText, {color: 'rgba(255, 255, 255, 0.6)'}]}>
                                                {formatTime((isSliding || isSeeking) ? sliderValue : progress.position)}
                                            </Text>
                                            <Text style={[styles.timeText, {color: 'rgba(255, 255, 255, 0.6)'}]}>
                                                -{formatTime(Math.max(0, progress.duration - ((isSliding || isSeeking) ? sliderValue : progress.position)))}
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
                                    style={[styles.playButton, {backgroundColor: '#FFFFFF'}]}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="large" color="#000000"/>
                                    ) : (
                                        <Icon
                                            name={isPlaying ? 'pause' : 'play'}
                                            type="ionicon"
                                            size={32}
                                            color="#000000"
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
        zIndex: Platform.OS === 'ios' ? 1000 : 100,
        ...(Platform.OS === 'android' && {
            overflow: 'hidden',
            elevation: 1,
            ...(Platform.Version >= 30 && {
                paddingTop: 0, // Let safe area handle this
            })
        })
    },
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: Platform.OS === 'ios' ? 1001 : 101,
        ...(Platform.OS === 'android' && {
            overflow: 'hidden',
            elevation: 2,
        })
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
        marginTop: 16,
        marginBottom: 40,
    },
    progressContainer: {
        paddingHorizontal: 0,
    },
    progressSlider: {
        width: '100%',
        height: 20,
    },
    sliderThumb: {
        width: 20,
        height: 20,
        backgroundColor: 'transparent',
    },
    sliderTrack: {
        height: 6,
        borderRadius: 4,
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
    tooltip: {
        position: 'absolute',
        top: -30,
        left: '50%',
        marginLeft: -30,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: Platform.OS === 'ios' ? 1000 : 200,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        minWidth: 60,
    },
    tooltipText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    tooltipArrow: {
        position: 'absolute',
        bottom: -6,
        left: '50%',
        marginLeft: -6,
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'rgba(0, 0, 0, 0.8)',
    },
});