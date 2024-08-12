import {Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {GlobalContext} from "../../utils/GlobalContext";
import AuthorIcon from "../../assets/icons/author.svg";
import PlayIcon from "../../assets/icons/play.svg";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";

export const Xiaoyuzhou = () => {
    const {globalState} = useContext(GlobalContext);
    const [news, setNews] = useState([]);
    const [sound, setSound] = useState(null);

    useEffect(() => {
        setNews(globalState['news']['xiaoyuzhou'])
    }, [globalState]);

    useEffect(() => {

    }, [sound]);

    const playSound = async (url, coverUrl) => {
        const mediaUrl = "https://s3.amazonaws.com/exp-us-standard/audio/playlist-example/Comfort_Fit_-_03_-_Sorry.mp3";
        await TrackPlayer.setupPlayer();

        await TrackPlayer.add({
            id: 'trackId',
            url: mediaUrl,
            title: 'Track Title',
            artist: 'Track Artist',
            artwork: coverUrl
        });

        await TrackPlayer.play();
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
                            <TouchableOpacity
                                style={styles.operationWrapper}
                                onPress={() => playSound(item.coverUrl, item.coverUrl)}
                            >
                                <PlayIcon width={32} height={32}/>
                            </TouchableOpacity>
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
