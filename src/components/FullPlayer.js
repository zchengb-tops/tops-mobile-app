import React from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import Modal from 'react-native-modal';
import {useTrack, useTrackStatus, useTrackStateStore} from "../hooks/TrackHooks";
import {Icon, Slider, useTheme} from "@rneui/themed";
import TrackPlayer, {State, useProgress} from "react-native-track-player";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {Text} from "./Text";
import {useDarkMode} from "../hooks/DarkModeHooks";
import {storage} from "../storage";
import {initializeTrackPlayer} from "./PlayerBar";

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export const FullPlayer = ({isVisible, onClose}) => {
    const currentTrack = useTrack();
    const status = useTrackStatus();
    const progress = useProgress(500);
    const insets = useSafeAreaInsets();
    const isDarkMode = useDarkMode();
    const {theme} = useTheme();
    
    const {setShowing, setTrack} = useTrackStateStore.getState();
    
    const formatTime = (time) => {
        if (!time || isNaN(time)) return '00:00:00';
        var hours = Math.floor(time / 3600);
        var minutes = Math.floor((time % 3600) / 60);
        var seconds = Math.floor(time % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    var isPlaying = status === State.Playing;
    var isLoading = status === State.Loading || status === State.Buffering || status === undefined;
    var hasPlayedComplete = progress.position >= progress.duration;
    
    var handlePlayPause = async () => {
        try {
            if (isPlaying) {
                await TrackPlayer.pause();
            } else {
                if (hasPlayedComplete) {
                    await TrackPlayer.seekTo(0);
                }
                await TrackPlayer.play();
            }
        } catch (error) {
            console.warn('Play/pause error:', error);
        }
    };
    
    var handleClose = async () => {
        setShowing(false);
        storage.set('currentTrack', JSON.stringify({}));
        setTrack({});
        await TrackPlayer.reset();
        initializeTrackPlayer().then(() => console.log('clean track play.'));
        onClose();
    };
    
    var handleSeekBack = async () => {
        try {
            var newPosition = Math.max(0, progress.position - 15);
            await TrackPlayer.seekTo(newPosition);
        } catch (error) {
            console.warn('Seek back error:', error);
        }
    };
    
    var handleSeekForward = async () => {
        try {
            var newPosition = Math.min(progress.duration, progress.position + 15);
            await TrackPlayer.seekTo(newPosition);
        } catch (error) {
            console.warn('Seek forward error:', error);
        }
    };
    
    return (
        <Modal
            isVisible={isVisible}
            style={styles.modal}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            animationInTiming={300}
            animationOutTiming={300}
            backdropOpacity={0}
            onBackdropPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection="down"
            propagateSwipe
            statusBarTranslucent
            onBackButtonPress={onClose}
        >
            <View style={[styles.container, {backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF', paddingTop: insets.top}]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Icon 
                            name="chevron-down" 
                            type="ionicon" 
                            size={28} 
                            color={isDarkMode ? '#FFFFFF' : '#000000'}
                        />
                    </TouchableOpacity>
                    <View style={styles.spacer} />
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Icon 
                            name="close" 
                            type="ionicon" 
                            size={24} 
                            color={isDarkMode ? '#FFFFFF' : '#000000'}
                        />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.contentContainer}>
                    <View style={styles.artworkContainer}>
                        {currentTrack?.artwork ? (
                            <Image style={styles.artwork} source={{uri: currentTrack.artwork}}/>
                        ) : (
                            <View style={[styles.artwork, styles.defaultArtwork]}>
                                <TopsIcon width={120} height={120}/>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.trackInfo}>
                        <Text 
                            style={[styles.title, {color: isDarkMode ? '#FFFFFF' : '#000000'}]}
                            numberOfLines={2}
                        >
                            {currentTrack?.title || 'Unknown Title'}
                        </Text>
                        <Text 
                            style={[styles.artist, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}
                            numberOfLines={1}
                        >
                            {currentTrack?.artist || 'Unknown Artist'}
                        </Text>
                    </View>
                    
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
                    
                    <View style={styles.controlsContainer}>
                        <TouchableOpacity onPress={handleSeekBack} style={styles.controlButton}>
                            <Icon 
                                name="play-skip-back" 
                                type="ionicon" 
                                size={28} 
                                color={isDarkMode ? '#FFFFFF' : '#000000'}
                            />
                            <Text style={[styles.skipText, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}>15s</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={handlePlayPause} 
                            style={[styles.playButton, {backgroundColor: isDarkMode ? '#FFFFFF' : '#000000'}]}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="large" color={isDarkMode ? '#000000' : '#FFFFFF'}/>
                            ) : (
                                <Icon 
                                    name={isPlaying ? 'pause' : 'play'} 
                                    type="ionicon" 
                                    size={40} 
                                    color={isDarkMode ? '#000000' : '#FFFFFF'}
                                />
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={handleSeekForward} style={styles.controlButton}>
                            <Icon 
                                name="play-skip-forward" 
                                type="ionicon" 
                                size={28} 
                                color={isDarkMode ? '#FFFFFF' : '#000000'}
                            />
                            <Text style={[styles.skipText, {color: isDarkMode ? '#AAAAAA' : '#666666'}]}>15s</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    container: {
        flex: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
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
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 32,
    },
    artist: {
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center',
    },
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
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    controlButton: {
        padding: 20,
        marginHorizontal: 20,
        alignItems: 'center',
    },
    skipText: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
