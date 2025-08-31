import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {BlurView as RNBlurView} from '@react-native-community/blur';

export const BlurView = ({children, blurType, style}) => {
    const isDark = blurType === 'dark';
    
    if (Platform.OS === 'web') {
        return (
            <View
                style={[
                    styles.container,
                    style,
                    {
                        backgroundColor: isDark 
                            ? 'rgba(0,0,0,0.6)' 
                            : 'rgba(255,255,255,0.6)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    }
                ]}
            >
                {children}
            </View>
        );
    }
    
    return (
        <RNBlurView
            style={[styles.container, style]}
            blurType={isDark ? 'dark' : 'light'}
            blurAmount={10}
            overlayColor={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}
        >
            {children}
        </RNBlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    }
});
