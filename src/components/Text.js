import React, { useEffect, useState } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { storage } from '../storage';

export const FONT_SIZE = {
    SMALL: '小',
    MEDIUM: '中',
    LARGE: '大'
};

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
    const lineHeight = getStyleValue(style, 'lineHeight') || fontSize * 1.4;

    if (Array.isArray(style)) {
        return style.map(s => {
            const scaled = { 
                ...s, 
                fontSize: fontSize * fontScale,
                lineHeight: lineHeight * fontScale
            };
            return scaled;
        });
    }

    return {
        ...style,
        fontSize: fontSize * fontScale,
        lineHeight: lineHeight * fontScale
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
