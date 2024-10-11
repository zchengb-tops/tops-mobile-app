import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../providers/NewsProvider";
import AuthorIcon from "../../assets/icons/author.svg";
import TrackPlayer, {Event, State, useProgress, useTrackPlayerEvents} from 'react-native-track-player';
import {useTrackStateStore} from "../AudioTrackStore";
import {useTrack, useTrackStatus} from "../hooks/TrackHooks";
import {Icon} from "@rneui/themed";
import {AnimatedCircularProgress} from "react-native-circular-progress";
import {globalStyles} from "../globalStyle";

export const Xiaoyuzhou = () => {
    const {allNews, refreshing, refreshNews} = useContext(NewsContext);
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
        const newsItem = allNews['xiaoyuzhou'];
        newsItem?.forEach((newsItem, index) => {
            newsItem.id = index;
            newsItem.position = 0;
            newsItem.hasBeenActive = false;
        });
        setNews(newsItem)
    }, [allNews]);

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

    const markHasBeenActive = (newsItem) => {
        const cloneNews = [...news];
        const index = cloneNews.findIndex(item => item.id === newsItem.id);
        if (index !== -1) {
            cloneNews[index].hasBeenActive = true;
        }
        setNews(cloneNews);
    }

    const isCurrentMediaItemPlayedComplete = (mediaItem) => {
        return mediaItem.id === playingTrack?.id && progress.position >= progress.duration;
    }

    const triggerTrackPlayerToPlay = async (mediaItem) => {
        if (!playingTrack || playingTrack?.id !== mediaItem.id || isCurrentMediaItemPlayedComplete(mediaItem)) {
            setPlayerBarShowing();
            let tracks = await TrackPlayer.getQueue();
            const trackIndex = tracks.findIndex(item => item.id === mediaItem.id)
            const track = {
                id: mediaItem.id,
                url: mediaItem.mediaUrl,
                title: mediaItem.title,
                artist: mediaItem.author,
                artwork: mediaItem.coverUrl,
                duration: mediaItem.duration,
                source: 'xiaoyuzhou'
            };
            setTrack(track);

            if (trackIndex !== -1) {
                console.log('start to skip.');
                await TrackPlayer.skip(trackIndex, isCurrentMediaItemPlayedComplete(mediaItem) ? 0 : mediaItem.position);
            } else {
                console.log('add new track to queue.');
                await TrackPlayer.add(track);

                markHasBeenActive(mediaItem);
                const queue = await TrackPlayer.getQueue();
                await TrackPlayer.skip(queue.length - 1, mediaItem.position);
            }
        }

        await TrackPlayer.play();
    }

    const isCurrentItemInTrack = (newsItem) => {
        return playingTrack && newsItem.id === playingTrack.id && playingTrack.source === 'xiaoyuzhou';
    }

    const isCurrentItemPlaying = (newsItem) => {
        return isCurrentItemInTrack(newsItem) && (playStatus === State.Playing);
    }

    const isCurrentItemLoading = (newsItem) => {
        return isCurrentItemInTrack(newsItem) && (playStatus === State.Loading);
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

    const handlePlayButtonClick = async (newsItemIndex) => {
        const newsItem = news[newsItemIndex];
        await TrackPlayer.pause();

        if (!isCurrentItemPlaying(newsItem)) {
            triggerTrackPlayerToPlay(newsItem);
        }
    }

    useEffect(() => console.log('start to render xiaoyuzhou'), []);

    return (
        <FlatList
            data={news}
            refreshControl={
                <RefreshControl style={globalStyles.refreshControl} refreshing={refreshing} onRefresh={refreshNews}/>
            }
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => (
                <View style={styles.newsItemWrapper}>
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
                            <View style={styles.extraInfoWrapper}>
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
                            <AnimatedCircularProgress
                                size={36}
                                width={2}
                                fill={(item.position / item.duration) * 100}
                                tintColor="#F66F00"
                                backgroundColor="transparent"
                                rotation={0}
                            >
                                {() => (
                                    <TouchableOpacity
                                        onPress={() => handlePlayButtonClick(index)}
                                        style={[
                                            styles.playButton,
                                            {backgroundColor: isCurrentItemPlaying(item) ? '#FBF0E7' : '#F1F1F1'},
                                        ]}
                                    >
                                        {isCurrentItemLoading(item) ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="#464646"
                                                style={styles.playLoadingIndicator}
                                            />
                                        ) : isCurrentItemPlaying(item) ? (
                                            <Icon size={18} name="pause" type="ionicon" color="#F76F00"/>
                                        ) : (
                                            <Icon
                                                size={18}
                                                name="play-sharp"
                                                type="ionicon"
                                                color="#464646"
                                                style={{marginLeft: 2}}
                                            />
                                        )}
                                    </TouchableOpacity>
                                )}
                            </AnimatedCircularProgress>
                        </View>
                    </View>
                </View>
            )}
        />
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
        paddingLeft: 20,
        paddingRight: 16,
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
        marginTop: 6
    },
    operationWrapper: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    playButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        width: 36,
        height: 36,
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
        width: 90,
        height: 90,
        marginRight: 14,
        borderRadius: 4
    },
    playLoadingIndicator: {
        transform: [{scale: 0.75}]
    }
});
