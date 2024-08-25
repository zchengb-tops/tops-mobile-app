import {ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {GlobalContext} from "../../utils/GlobalContext";
import AuthorIcon from "../../assets/icons/author.svg";
import TrackPlayer, {Capability, Event, State, useProgress, useTrackPlayerEvents} from 'react-native-track-player';
import {useTrackStateStore} from "../store";
import {useTrack, useTrackStatus} from "../hooks/TrackHooks";
import {Icon, Slider} from "@rneui/themed";
import {AnimatedCircularProgress} from "react-native-circular-progress";

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
            console.log('setPlayerBarShowing')
            let tracks = await TrackPlayer.getQueue();
            console.log('tracks', tracks);
            const trackIndex = tracks.findIndex(item => item.id === mediaItem.id)
            console.log('trackIndex', trackIndex, mediaItem);
            const track = {
                id: mediaItem.id,
                url: mediaItem.mediaUrl,
                title: mediaItem.title,
                artist: mediaItem.author,
                artwork: mediaItem.coverUrl,
                duration: mediaItem.duration
            };
            console.log('track', track);
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
                                <Text style={styles.author} numberOfLines={1} ellipsizeMode='tail'>{item.author}</Text>
                            </View>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 12,
                            }}>
                                <Icon
                                    size={16}
                                    name='time-outline'
                                    type='ionicon'
                                    color='#939393'
                                />
                                <Text style={styles.duration} numberOfLines={1} ellipsizeMode='tail'>
                                    {formatDuration(item.duration)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.operationWrapper}>
                            <View style={{alignItems: 'center', justifyContent: 'center'}}>
                                <AnimatedCircularProgress
                                    size={32}
                                    width={1}
                                    fill={(item.position / item.duration) * 100}
                                    tintColor="#F66F00"
                                    backgroundColor="transparent"
                                    rotation={0}
                                >
                                    {
                                        () => (
                                            <TouchableOpacity
                                                onPress={() => handlePlayButtonClick(index)}
                                                style={{
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: isCurrentItemPlaying(item) ? '#FBF0E7' : '#F1F1F1',
                                                    borderRadius: 20,
                                                    width: 32,
                                                    height: 32,
                                                }}
                                            >
                                                {
                                                    isCurrentItemLoading(item)
                                                        ?
                                                        <ActivityIndicator size="small" color={'#464646'}
                                                                           style={{transform: [{scale: 0.75}]}}/>
                                                        :
                                                        (
                                                            isCurrentItemPlaying(item)
                                                                ?
                                                                <Icon size={18} name='pause' type='ionicon'
                                                                      color='#F76F00'/>
                                                                :
                                                                <Icon size={18} name='play-sharp' type='ionicon'
                                                                      color='#464646'
                                                                      style={{marginLeft: 2}}/>
                                                        )
                                                }
                                            </TouchableOpacity>
                                        )
                                    }
                                </AnimatedCircularProgress>
                            </View>
                        </View>
                    </View>
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
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    infoContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        color: '#464646',
        lineHeight: 24,
    },
    extraInfoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12
    },
    operationWrapper: {
        // marginTop: 12
    },
    trendType: {
        color: '#939393',
        fontSize: 14,
        marginRight: 8
    },
    author: {
        color: '#939393',
        fontSize: 14,
        marginLeft: 4
    },
    duration: {
        color: '#939393',
        marginLeft: 4,
        fontSize: 14,
    },
    image: {
        width: 100,
        height: 100,
        marginRight: 14,
        marginLeft: 6,
        borderRadius: 4
    },
});
