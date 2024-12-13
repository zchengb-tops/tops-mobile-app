import React, { useEffect, useState } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { FONT_SIZE } from '../constant';
import { storage } from '../storage';

const getFontScale = (savedFontSize) => {
    switch (savedFontSize) {
        case FONT_SIZE.SMALL:
            return 0.8;
        case FONT_SIZE.LARGE:
            return 1.2;
        case FONT_SIZE.MEDIUM:
        default:
            return 1;
    }
};

const getStyleValue = (style, property) => {
    if (Array.isArray(style)) {
        return style.find(s => s?.[property])?.[property];
    }
    return style?.[property];
};

const scaleStyle = (style, fontScale) => {
    const fontSize = getStyleValue(style, 'fontSize') || 14;
    const lineHeight = getStyleValue(style, 'lineHeight');

    if (Array.isArray(style)) {
        return style.map(s => {
            const scaled = { 
                ...s, 
                fontSize: fontSize * fontScale 
            };
            
            if (lineHeight && fontScale === 1.2) {
                scaled.lineHeight = s.lineHeight * 1.2;
            } else if (!lineHeight && fontScale === 1.2) {
                scaled.lineHeight = 18 * 1.2;
            }
            
            return scaled;
        });
    }

    return {
        ...style,
        fontSize: fontSize * fontScale,
        ...(lineHeight && fontScale === 1.2 ? { lineHeight: lineHeight * 1.2 } : {})
    };
};

export const Text = ({ style, children, variant = 'primary', ...props }) => {
    const [fontScale, setFontScale] = useState(getFontScale(storage.getString('fontSize')));

    useEffect(() => {
        const listener = storage.addOnValueChangedListener((key) => {
            if (key === 'fontSize') {
                setFontScale(getFontScale(storage.getString('fontSize')));
            }
        });

        return () => {
            listener.remove();
        };
    }, []);

    const scaledStyle = scaleStyle(style, fontScale);

    return (
        <RNText
            allowFontScaling={false}
            style={[styles.text, scaledStyle]}
            {...props}
        >
            {children}
        </RNText>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 14,
        lineHeight: 20
    }
});
