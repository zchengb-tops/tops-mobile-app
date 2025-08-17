import React, {useEffect, useRef} from 'react';
import {TouchableOpacity, StyleSheet, Image, ActivityIndicator, Animated, Easing, View, PanResponder, Dimensions, Platform} from 'react-native';
import {useTrack, useTrackStatus} from "../hooks/TrackHooks";
import {State, useProgress} from "react-native-track-player";
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {AnimatedCircularProgress} from 'react-native-circular-progress';

export const MiniPlayer = ({onPress}) => {
    const currentTrack = useTrack();
    const status = useTrackStatus();
    const progress = useProgress(1000);
    const insets = useSafeAreaInsets();
    const rotationValue = useRef(new Animated.Value(0)).current;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    const pan = useRef(new Animated.ValueXY({
        x: screenWidth - 80, // Start from right edge with symmetric margin
        y: screenHeight - 160 - insets.bottom // Start above tab bar
    })).current;
    
    if (!currentTrack?.title) return null;
    
    var isLoading = status === State.Loading || status === State.Buffering || status === undefined;
    var isPlaying = status === State.Playing;
    var progressPercent = progress.duration > 0 ? (progress.position / progress.duration) * 100 : 0;
    
    useEffect(() => {
        if (isPlaying) {
            Animated.loop(
                Animated.timing(rotationValue, {
                    toValue: 1,
                    duration: 8000, // Slower rotation - 8 seconds instead of 3
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            rotationValue.stopAnimation();
        }
    }, [isPlaying]);
    
    const rotation = rotationValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    
    const dragOffset = useRef({x: 0, y: 0});
    
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onMoveShouldSetPanResponderCapture: (_, gestureState) => {
                // Capture gesture to prevent parent scroll
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onShouldBlockNativeResponder: () => true,
            onPanResponderGrant: (evt) => {
                dragOffset.current = {
                    x: pan.x._value - evt.nativeEvent.pageX,
                    y: pan.y._value - evt.nativeEvent.pageY,
                };
            },
            onPanResponderMove: (evt) => {
                var newX = evt.nativeEvent.pageX + dragOffset.current.x;
                var newY = evt.nativeEvent.pageY + dragOffset.current.y;
                
                // Apply boundaries during drag - symmetric margins
                var minMarginLeft = 0; // Narrower to match right margin
                var minMarginRight = 80; // Reduced to match user's preference
                var minHeight = insets.top + 80; // Adjustable minimal height
                var maxHeight = screenHeight - 150 - insets.bottom; // More space from bottom
                
                newX = Math.max(minMarginLeft, Math.min(screenWidth - minMarginRight, newX));
                newY = Math.max(minHeight, Math.min(maxHeight, newY));
                
                pan.setValue({x: newX, y: newY});
            },
            onPanResponderRelease: (_, gestureState) => {
                // Get current position
                var currentX = pan.x._value;
                var currentY = pan.y._value;
                
                // Snap to edges with symmetric margins
                var newX = currentX < screenWidth / 2 ? 0 : screenWidth - 80;
                
                Animated.spring(pan, {
                    toValue: {x: newX, y: currentY},
                    useNativeDriver: false,
                    tension: 100,
                    friction: 8,
                }).start();
                
                // Handle tap if didn't move much
                if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
                    onPress && onPress();
                }
            },
        })
    ).current;
    
    return (
        <Animated.View 
            style={[
                styles.container,
                {
                    transform: pan.getTranslateTransform(),
                }
            ]}
        >
            <View 
                style={styles.touchableArea}
                {...panResponder.panHandlers}
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
                                { transform: [{ rotate: isPlaying ? rotation : '0deg' }] }
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
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 1000,
    },
    touchableArea: {
        padding: 8,
        borderRadius: 40,
        // Android-specific shadow fix
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
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
