import React, {useRef, useState} from 'react';
import {Animated, View} from 'react-native';

export const PressableNewsItem = ({children, onPress, style, activeOpacity = 0.8}) => {
    const isDraggingRef = useRef(false);
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handleResponderGrant = () => {
        Animated.timing(opacityAnim, {
            toValue: activeOpacity,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };

    const handleResponderRelease = () => {
        Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        if (!isDraggingRef.current && onPress) {
            onPress();
        }
        isDraggingRef.current = false;
    };

    const handleResponderMove = (event) => {
        if (Math.abs(event.nativeEvent.moveX - event.nativeEvent.locationX) > 5 || 
            Math.abs(event.nativeEvent.moveY - event.nativeEvent.locationY) > 5) {
            isDraggingRef.current = true;
            
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }).start();
        }
    };

    const handleResponderTerminate = () => {
        isDraggingRef.current = true;
        
        Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View
            style={[style, {opacity: opacityAnim}]}
            onStartShouldSetResponder={() => true}
            onResponderGrant={handleResponderGrant}
            onResponderMove={handleResponderMove}
            onResponderRelease={handleResponderRelease}
            onResponderTerminate={handleResponderTerminate}
        >
            {children}
        </Animated.View>
    );
};
