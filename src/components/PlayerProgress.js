import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Slider, useTheme} from "@rneui/themed";
import TrackPlayer, {useProgress} from "react-native-track-player";
import {Text} from "./Text";
import {useDarkMode} from "../hooks/DarkModeHooks";

export const PlayerProgress = () => {
    const progress = useProgress(500);
    const isDarkMode = useDarkMode();
    const {theme} = useTheme();

    const formatTime = (time) => {
        if (!time || isNaN(time)) return '00:00:00';
        var hours = Math.floor(time / 3600);
        var minutes = Math.floor((time % 3600) / 60);
        var seconds = Math.floor(time % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.progressContainer}>
            <Slider
                style={styles.progressSlider}
                minimumValue={0}
                maximumValue={progress.duration || 1}
                value={progress.position}
                onSlidingComplete={(value) => TrackPlayer.seekTo(value)}
                minimumTrackTintColor="#F76F00"
                maximumTrackTintColor={isDarkMode ? '#333333' : '#E5E5EA'}
                thumbStyle={[styles.sliderThumb, {backgroundColor: '#F76F00'}]}
                trackStyle={styles.sliderTrack}
            />
            <View style={styles.timeContainer}>
                <Text style={[styles.timeText, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}>
                    {formatTime(progress.position)}
                </Text>
                <Text style={[styles.timeText, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}>
                    {formatTime(progress.duration)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    progressContainer: {
        marginBottom: 40,
    },
    progressSlider: {
        height: 40,
    },
    sliderTrack: {
        height: 4,
        borderRadius: 2,
    },
    sliderThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: 8,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '400',
    },
});