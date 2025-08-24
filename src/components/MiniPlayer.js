import React, {useEffect, useRef} from 'react';
import {StyleSheet, Image, ActivityIndicator, Animated, Easing, View, Dimensions, Platform} from 'react-native';
import {useTrack, useTrackStatus} from "../hooks/TrackHooks";
import {State, useProgress} from "react-native-track-player";
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {PanGestureHandler, State as GestureState, TapGestureHandler} from 'react-native-gesture-handler';

export const MiniPlayer = ({onPress}) => {
    const currentTrack = useTrack();
    const status = useTrackStatus();
    const progress = useProgress(1000);
    const insets = useSafeAreaInsets();
    const rotationValue = useRef(new Animated.Value(0)).current;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    const pan = useRef(new Animated.ValueXY({
        x: screenWidth - 80,
        y: screenHeight - 160 - insets.bottom
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
                    duration: 8000,
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
    
    const panRef = useRef();
    const tapRef = useRef();

    const onPanGestureEvent = (event) => {
        var newX = event.nativeEvent.absoluteX + dragOffset.current.x;
        var newY = event.nativeEvent.absoluteY + dragOffset.current.y;

        // Apply boundaries during drag - symmetric margins
        var minMarginLeft = 0;
        var minMarginRight = 80;
        var minHeight = insets.top + 80;
        var maxHeight = screenHeight - 150 - insets.bottom;

        newX = Math.max(minMarginLeft, Math.min(screenWidth - minMarginRight, newX));
        newY = Math.max(minHeight, Math.min(maxHeight, newY));

        pan.x.setValue(newX);
        pan.y.setValue(newY);
    };

    const onPanHandlerStateChange = (event) => {
        if (event.nativeEvent.state === GestureState.BEGAN) {
            dragOffset.current = {
                x: pan.x._value - event.nativeEvent.absoluteX,
                y: pan.y._value - event.nativeEvent.absoluteY,
            };
        } else if (event.nativeEvent.state === GestureState.END) {
            var currentX = pan.x._value;
            var currentY = pan.y._value;
            
            var newX = currentX < screenWidth / 2 ? 0 : screenWidth - 80;
            
            Animated.spring(pan, {
                toValue: {x: newX, y: currentY},
                useNativeDriver: false,
                tension: 100,
                friction: 8,
            }).start();
        }
    };

    const onTapHandlerStateChange = (event) => {
        if (event.nativeEvent.state === GestureState.END) {
            onPress && onPress();
        }
    };
    
    return (
        <PanGestureHandler
            ref={panRef}
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanHandlerStateChange}
            minDist={5}
            simultaneousHandlers={tapRef}
        >
            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: pan.getTranslateTransform(),
                    }
                ]}
            >
                <TapGestureHandler
                    ref={tapRef}
                    onHandlerStateChange={onTapHandlerStateChange}
                    simultaneousHandlers={panRef}
                >
                    <View style={styles.touchableArea}>
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
                </TapGestureHandler>
            </Animated.View>
        </PanGestureHandler>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 9999,
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
