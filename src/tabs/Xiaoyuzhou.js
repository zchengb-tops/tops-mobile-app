import {ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {GlobalContext} from "../../utils/GlobalContext";
import AuthorIcon from "../../assets/icons/author.svg";
import TrackPlayer, {Capability, Event, State, useProgress, useTrackPlayerEvents} from 'react-native-track-player';
import {useTrackStateStore} from "../store";
import {useTrack, useTrackStatus} from "../hooks/TrackHooks";
import {Icon, Slider} from "@rneui/themed";

export const Xiaoyuzhou = () => {
    const {globalState} = useContext(GlobalContext);
    const [news, setNews] = useState([]);
    const progress = useProgress();
    const playStatus = useTrackStatus();
    const playingTrack = useTrack();

    const setPlayerBarShowing = useTrackStateStore.getState().setShowing;
    const setTrack = useTrackStateStore.getState().setTrack;

    useEffect(() => {
        if (playingTrack) {
            const newsItems = [...news];

            let targetIndex = -1;

            newsItems.forEach((item, index) => {
                if (item?.id === playingTrack.id) {
                    targetIndex = index;
                }
            })

            if (targetIndex !== -1) {
                const playDone = progress.position === progress.duration || progress.position >= progress.duration;

                if (playDone) {
                    newsItems[targetIndex].position = 0;
                    newsItems[targetIndex].hasBeenActive = false;
                } else {
                    newsItems[targetIndex].position = progress.position;
                }

                setNews(newsItems);
            }
        }
    }, [progress]);

    useEffect(() => {
        initializeTrackPlayer().then(r => console.log('initialize track player'));
    }, []);

    useEffect(() => {
        const newsItem = globalState['news']['xiaoyuzhou'];
        newsItem?.forEach((newsItem, index) => {
            newsItem.id = index;
            newsItem.position = 0;
            newsItem.hasBeenActive = false;
        });
        setNews(newsItem)
    }, [globalState]);

    useTrackPlayerEvents([
            Event.RemotePause, Event.RemotePlay, Event.RemoteStop,
            Event.RemoteJumpForward, Event.RemoteJumpBackward, Event.RemoteSeek
        ],
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
                    break;
                case Event.RemoteStop:
                    await TrackPlayer.reset();
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

    const initializeTrackPlayer = async () => {
        await TrackPlayer.setupPlayer();

        await TrackPlayer.updateOptions({
            progressUpdateEventInterval: 1,
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

    const triggerTrackPlayerToPlay = async (mediaItem) => {
        if (!playingTrack || playingTrack?.id !== mediaItem.id) {
            setPlayerBarShowing();
            let tracks = await TrackPlayer.getQueue();
            const trackIndex = tracks.findIndex(item => item.id === mediaItem.id)

            const track = {
                id: mediaItem.id,
                url: mediaItem.mediaUrl,
                title: mediaItem.title,
                artist: mediaItem.author,
                artwork: mediaItem.coverUrl,
                duration: mediaItem.duration
            };
            setTrack(track);

            if (trackIndex !== -1) {
                await TrackPlayer.skip(trackIndex, mediaItem.position);
            } else {
                await TrackPlayer.add(track);

                const newItems = [...news];
                const index = newItems.findIndex(item => item.id === mediaItem.id);
                if (index !== -1) {
                    newItems[index].hasBeenActive = true;
                }
                setNews(newItems);
                const queue = await TrackPlayer.getQueue();
                await TrackPlayer.skip(queue.length - 1, mediaItem.position);
            }
        }

        await TrackPlayer.play();
    }

    const isCurrentItemInTrack = (newsItem) => {
        return playingTrack && newsItem.id === playingTrack.id;
    }

    const isCurrentItemPlaying = (newsItem) => {
        return isCurrentItemInTrack(newsItem) && playStatus === State.Playing;
    }

    const isCurrentItemLoading = (newsItem) => {
        return isCurrentItemInTrack(newsItem)
            && (playStatus === State.Loading || playStatus === State.Buffering || playStatus === State.Ready);
    }

    const formatDuration = (duration) => {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);

        if (hours > 0 && minutes > 0) {
            return `${hours}小时${minutes}分钟`;
        } else if (hours > 0) {
            return `${hours}小时`;
        } else {
            return `${minutes}分钟`;
        }
    }

    const handlePlayButtonClick = (newsItemIndex) => {
        const newsItem = news[newsItemIndex];
        if (isCurrentItemPlaying(newsItem)) {
            TrackPlayer.pause();
        } else {
            triggerTrackPlayerToPlay(newsItem)
        }
    }

    const getRemainingTime = (newsItemIndex) => {
        const newsItem = news[newsItemIndex];

        return formatDuration(newsItem.duration - newsItem.position)
    }

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
                                <AuthorIcon/>
                                <Text style={styles.author} numberOfLines={1}
                                      ellipsizeMode='tail'>{item.author}</Text>
                            </View>
                            <View style={styles.operationWrapper}>
                                {
                                    <TouchableOpacity
                                        onPress={() => {
                                            handlePlayButtonClick(index)
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#feeedd',
                                            borderRadius: 10,
                                            alignSelf: 'flex-start',
                                            paddingHorizontal: 10,
                                            paddingVertical: 4,
                                        }}
                                    >
                                        {
                                            isCurrentItemLoading(item)
                                                ?
                                                <ActivityIndicator size="small" color={'#F66F00'} style={{
                                                    transform: [{scale: 0.75}]
                                                }}/>
                                                :
                                                (
                                                    isCurrentItemPlaying(item)
                                                        ?
                                                        <Icon
                                                            size={14}
                                                            name='pause'
                                                            type='ionicon'
                                                            color='#F66F00'
                                                        />
                                                        :
                                                        <Icon
                                                            size={14}
                                                            name='play'
                                                            type='ionicon'
                                                            color='#F66F00'
                                                        />
                                                )
                                        }

                                        {
                                            item?.hasBeenActive
                                                ?
                                                <Slider
                                                    disabled
                                                    maximumTrackTintColor="#ccc"
                                                    maximumValue={item.duration}
                                                    minimumTrackTintColor="#F66F00"
                                                    minimumValue={0}
                                                    orientation="horizontal"
                                                    step={1}
                                                    style={{
                                                        height: 24,
                                                        marginLeft: 4,
                                                        marginRight: 4,
                                                        width: 30,
                                                    }}
                                                    thumbStyle={{height: 4, width: 4}}
                                                    thumbTintColor="#F66F00"
                                                    value={item.position}
                                                    pointerEvents="none"
                                                />
                                                :
                                                <></>
                                        }

                                        <Text style={{
                                            marginLeft: 4,
                                            color: '#F66F00',
                                            fontSize: 14,
                                            fontWeight: '500'
                                        }}>
                                            {getRemainingTime(index)}
                                        </Text>
                                    </TouchableOpacity>
                                }
                            </View>
                        </View>
                    </View>
                    <View style={styles.borderBottom}/>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    newsItemWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    newItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
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
        marginTop: 12
    },
    trendType: {
        color: '#939393',
        fontSize: 14,
        marginRight: 8
    },
    author: {
        color: '#939393',
        fontSize: 14,
        marginLeft: 2
    },
    image: {
        width: 100,
        height: 100,
        marginRight: 14,
        marginLeft: 6,
        borderRadius: 4
    },
});
