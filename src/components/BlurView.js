import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';

export const BlurView = ({children, blurType, style}) => {
    const isDark = blurType === 'dark';
    
    return (
        <View
            style={[
                styles.container,
                style,
                {
                    backgroundColor: isDark 
                        ? 'rgba(0,0,0,0.6)' 
                        : 'rgba(255,255,255,0.6)',
                    ...(Platform.OS === 'web' && {
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                    })
                }
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    }
});
