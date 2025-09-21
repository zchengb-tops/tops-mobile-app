import {useNavigation} from "@react-navigation/native";
import {Icon, useTheme} from "@rneui/themed";
import React, {useEffect, useState} from "react";
import {ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View} from "react-native";
import {AnimatedCircularProgress} from "react-native-circular-progress";
import TrackPlayer, {State, useProgress} from 'react-native-track-player';
import AuthorIcon from "../../assets/icons/author.svg";
import {Text} from "../components/Text";
import {globalStyles} from "../globalStyle";
import {useTrack, useTrackStateStore, useTrackStatus} from "../hooks/TrackHooks";
import useNewsStore from '../stores/useNewsStore';
import {useDarkMode} from "../hooks/DarkModeHooks";

export const Xiaoyuzhou = () => {
    const normalNews = useNewsStore(state => state.normalNews);
    const normalRefreshing = useNewsStore(state => state.normalRefreshing);
    const refreshNews = useNewsStore(state => state.refreshNews);
    const [news, setNews] = useState([]);
    const progress = useProgress();
    const playStatus = useTrackStatus();
    const playingTrack = useTrack();
    const navigation = useNavigation();
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();
    const setPlayerBarShowing = useTrackStateStore.getState().setShowing;
    const setTrack = useTrackStateStore.getState().setTrack;

    useEffect(() => {
        if (playingTrack && news.length > 0) {
            const newsItems = [...news];

            let targetIndex = -1;

            newsItems.forEach((item, index) => {
                if (isCurrentItemInTrack(item)) {
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
    }, [progress.position, progress.duration, playingTrack]);

    useEffect(() => {
        const newsItem = normalNews['xiaoyuzhou'];
        newsItem?.forEach((newsItem, index) => {
            newsItem.id = index;
            newsItem.position = 0;
            newsItem.hasBeenActive = false;
        });
        setNews(newsItem)
    }, [normalNews]);

    const markHasBeenActive = (newsItem) => {
        const cloneNews = [...news];
        const index = cloneNews.findIndex(item => item.id === newsItem.id);
        if (index !== -1) {
            cloneNews[index].hasBeenActive = true;
        }
        setNews(cloneNews);
    }

    const isCurrentMediaItemPlayedComplete = (mediaItem) => {
        return (isCurrentItemInTrack(mediaItem) && progress.position >= progress.duration) || mediaItem.position >= mediaItem.duration;
    }

    const triggerTrackPlayerToPlay = async (mediaItem) => {
        if (!playingTrack || !isCurrentItemInTrack(mediaItem) || isCurrentMediaItemPlayedComplete(mediaItem)) {
            setPlayerBarShowing();
            let tracks = await TrackPlayer.getQueue();
            const trackIndex = tracks.findIndex(item => (item.id === mediaItem.id && item.title === mediaItem.title && item.artist === mediaItem.author && item.source === 'xiaoyuzhou'))

            const track = {
                id: mediaItem.id,
                url: mediaItem.mediaUrl,
                title: mediaItem.title,
                artist: mediaItem.author,
                artwork: mediaItem.hdCoverUrl || mediaItem.coverUrl,
                duration: mediaItem.duration,
                source: 'xiaoyuzhou',
                date: mediaItem.publishDate || mediaItem.publishTime || mediaItem.date
            };
            setTrack(track);
            if (trackIndex !== -1) {
                console.log('start to skip.');
                await TrackPlayer.skip(trackIndex, isCurrentMediaItemPlayedComplete(mediaItem) ? 0 : mediaItem.position);
            } else {
                await TrackPlayer.add(track);

                markHasBeenActive(mediaItem);
                const queue = await TrackPlayer.getQueue();
                await TrackPlayer.skip(queue.length - 1, mediaItem.position);
                console.log('add new track to queue.');
            }
        }

        await TrackPlayer.play();
    }

    const isCurrentItemInTrack = (newsItem) => {
        return playingTrack && newsItem.id === playingTrack.id && newsItem.title === playingTrack.title && newsItem.author === playingTrack.artist && playingTrack.source === 'xiaoyuzhou';
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
        try {
            const newsItem = news[newsItemIndex];
            
            if (isCurrentItemPlaying(newsItem)) {
                // If currently playing this item, just pause
                await TrackPlayer.pause();
            } else {
                // If not playing this item, pause current and play new
                await TrackPlayer.pause();
                await triggerTrackPlayerToPlay(newsItem);
            }
        } catch (error) {
            console.warn('Play button click error:', error);
        }
    }

    useEffect(() => console.log('start to render xiaoyuzhou'), []);

    return (
        <FlatList
            data={news}
            refreshControl={
                <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing}
                                onRefresh={refreshNews} tintColor={isDarkMode ? '#d77f31' : ''}/>
            }
            contentContainerStyle={styles.contentContainer}
            keyExtractor={(item, index) => `${item.id || index}-${item.title || 'unknown'}`}
            renderItem={({item, index}) => (
                <TouchableOpacity style={styles.newsItemWrapper}
                                  delayPressIn={200}
                                  activeOpacity={0.8}
                                  onPress={() => navigation.navigate('NewsDetailScreen', {
                                      url: item.url,
                                      title: item.title
                                  })}>
                    <View style={styles.newItemContainer}>
                        <Image
                            style={styles.image}
                            resizeMode="cover"
                            source={{uri: item.coverUrl}}
                        />

                        <View style={styles.infoContainer}>
                            <Text style={[styles.title, {color: theme.colors.text}]} numberOfLines={2}
                                  ellipsizeMode='tail'>{item.title}</Text>
                            <View style={styles.extraInfoWrapper}>
                                <AuthorIcon/>
                                <Text style={[styles.author, {color: theme.colors.secondaryText}]} numberOfLines={1}
                                      ellipsizeMode='tail'>{item.author}</Text>
                            </View>
                            <View style={styles.extraInfoWrapper}>
                                <Icon
                                    size={16}
                                    name='time-outline'
                                    type='ionicon'
                                    color={theme.colors.secondaryText}
                                />
                                <Text style={[styles.duration, {color: theme.colors.secondaryText}]} numberOfLines={1}
                                      ellipsizeMode='tail'>
                                    {formatDuration(item.duration)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.operationWrapper}>
                            <AnimatedCircularProgress
                                size={36}
                                width={2}
                                fill={Math.min(100, Math.max(0, (item.position && item.duration) ? (item.position / item.duration) * 100 : 0))}
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
                                            <Icon size={16} name="pause" type="ionicon" color="#F76F00"/>
                                        ) : (
                                            <Icon
                                                size={16}
                                                name="play"
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
                </TouchableOpacity>
            )}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {},
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
    author: {
        fontSize: 14,
        marginLeft: 4
    },
    duration: {
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
