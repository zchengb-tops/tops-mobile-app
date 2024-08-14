import {Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {GlobalContext} from "../../utils/GlobalContext";
import AuthorIcon from "../../assets/icons/author.svg";
import PlayIcon from "../../assets/icons/play.svg";
import PauseIcon from "../../assets/icons/pause.svg";
import TrackPlayer, {Event} from 'react-native-track-player';
import {Capability, useTrackPlayerEvents} from "react-native-track-player";

export const Xiaoyuzhou = () => {
    const {globalState} = useContext(GlobalContext);
    const [news, setNews] = useState([]);
    const [playingMediaIndex, setPlayingMediaIndex] = useState(null);

    const initializeTrackPlayer = async () => {
        await TrackPlayer.setupPlayer();

        await TrackPlayer.updateOptions({
            stopWithApp: true,
            capabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.Stop,
                Capability.JumpForward,
                Capability.JumpBackward,
                Capability.SeekTo
            ],
            compactCapabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.JumpForward,
                Capability.JumpBackward
            ],
            // Control capabilities in iOS lock screen and control center
            notificationCapabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.Stop,
                Capability.JumpForward,
                Capability.JumpBackward,
                Capability.SeekTo
            ],
            // Control capabilities in Android lock screen and notification
            androidCapabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.Stop,
                Capability.JumpForward,
                Capability.JumpBackward
            ],
        });
    }

    useEffect(() => {
        initializeTrackPlayer().then(r => console.log('initialize track player'));
    }, []);

    useEffect(() => {
        const newsItem = globalState['news']['xiaoyuzhou'];
        newsItem?.forEach(newsItem => newsItem.playing = false);
        setNews(newsItem)
    }, [globalState]);

    useTrackPlayerEvents([Event.RemotePause, Event.RemotePlay, Event.RemoteStop, Event.RemoteJumpForward, Event.RemoteJumpBackward, Event.RemoteSeek],
        async (event) => {
            switch (event.type) {
                case Event.RemoteSeek:
                    await TrackPlayer.seekTo(event.position);
                    break;
                case Event.RemotePlay:
                    await TrackPlayer.play();
                    break;
                case Event.RemotePause:
                    await TrackPlayer.pause();
                    updatePlayingMediaStatus(false);
                    break;
                case Event.RemoteStop:
                    await TrackPlayer.stop();
                    updatePlayingMediaStatus(false);
                    break;
                case Event.RemoteJumpForward:
                    TrackPlayer.getProgress().then(progress => {
                        let nextPosition = progress.position + event.interval;
                        nextPosition = nextPosition > progress.duration ? progress.duration : nextPosition;
                        TrackPlayer.seekTo(nextPosition);
                    })
                    break;
                case Event.RemoteJumpBackward:
                    TrackPlayer.getProgress().then(progress => {
                        let nextPosition = progress.position - event.interval;
                        nextPosition = nextPosition < 0 ? 0 : nextPosition;
                        TrackPlayer.seekTo(nextPosition);
                    })
                    break;
                default:
                    break;
            }
        });

    const updatePlayingMediaStatus = (isPlaying) => {
        const updatedNews = [...news];

        if (playingMediaIndex !== null) {
            updatedNews[playingMediaIndex].playing = isPlaying;
        }

        setNews(updatedNews);
    }

    const pauseSound = async () => {
        await TrackPlayer.pause();

        updatePlayingMediaStatus(false);

        setPlayingMediaIndex(null);
    }

    const playSound = async (mediaItem, mediaItemIndex) => {
        if (playingMediaIndex !== mediaItemIndex) {
            await TrackPlayer.reset();
        }

        await TrackPlayer.add({
            url: mediaItem.mediaUrl,
            title: mediaItem.title,
            artist: mediaItem.author,
            artwork: mediaItem.coverUrl,
            duration: mediaItem.duration
        });

        await TrackPlayer.play();

        mediaItem.playing = true;

        setPlayingMediaIndex(mediaItemIndex);
    };

    return (
        <ScrollView>
            {news?.map((item, index) => (
                <View style={styles.newsItemWrapper} key={index}>
                    <View style={styles.newItemContainer}>
                        <Image
                            style={styles.image}
                            resizeMode="cover"
                            source={{uri: item.coverUrl}}
                        />

                        <View style={styles.infoContainer}>
                            <Text style={styles.title} numberOfLines={2} ellipsizeMode='tail'>{item.title}</Text>
                            <View style={styles.extraInfoWrapper}>
                                <Text style={styles.trendType}>#{item.trendType}</Text>
                                <AuthorIcon/>
                                <Text style={styles.author} numberOfLines={1} ellipsizeMode='tail'>{item.author}</Text>
                            </View>
                        </View>

                        <View style={styles.operationWrapper}>
                            {
                                item?.playing ?
                                    <TouchableOpacity
                                        style={styles.operationWrapper}
                                        onPress={() => pauseSound()}
                                    >
                                        <PauseIcon width={32} height={32}/>
                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity
                                        style={styles.operationWrapper}
                                        onPress={() => playSound(item, index)}
                                    >
                                        <PlayIcon width={32} height={32}/>
                                    </TouchableOpacity>
                            }
                        </View>
                    </View>
                    <View style={styles.borderBottom}/>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    newsItemWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    newItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        height: 120
    },
    borderBottom: {
        borderBottomColor: 'rgba(0,0,0,0.08)',
        borderBottomWidth: 1,
        width: '94%',
    },
    infoContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        color: 'rgba(0,0,0,0.85)',
        lineHeight: 16 * 1.5,
        fontWeight: '500'
    },
    extraInfoWrapper: {
        flexDirection: 'row',
        marginTop: 12
    },
    operationWrapper: {
        marginLeft: 8,
        marginRight: 8
    },
    trendType: {
        color: '#939393',
        fontSize: 14,
        marginRight: 8
    },
    author: {
        maxWidth: 160,
        color: '#939393',
        fontSize: 14,
        marginLeft: 2
    },
    image: {
        width: 80,
        height: 80,
        marginRight: 14,
        marginLeft: 6
    },
});
