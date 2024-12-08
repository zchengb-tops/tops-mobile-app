import React, {useEffect, useState} from 'react';
import {Text as RNText, StyleSheet} from 'react-native';
import {storage} from '../storage';
import {FONT_SIZE} from '../constant';

const getFontScale = (savedFontSize) => {
    switch(savedFontSize) {
        case FONT_SIZE.SMALL:
            return 0.8;
        case FONT_SIZE.LARGE:
            return 1.2;
        case FONT_SIZE.MEDIUM:
        default:
            return 1;
    }
};

export const Text = ({style, children, ...props}) => {
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

    const fontSize = style?.fontSize;
    const scaledStyle = fontSize ? {
        ...style,
        fontSize: fontSize * fontScale
    } : style;

    return (
        <RNText 
            allowFontScaling={false}
            style={scaledStyle} 
            {...props}
        >
            {children}
        </RNText>
    );
};

const styles = StyleSheet.create({
    text: {
        color: '#464646'
    }
});
