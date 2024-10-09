import {FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../../utils/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import FlashlightIcon from "../../assets/icons/flashlight.svg";
import CommentIcon from "../../assets/icons/comment.svg";
import {useTrackShowing} from "../hooks/TrackHooks";
import {globalStyles} from "../globalStyle";

export const NnGroup = () => {
    const {allNews, refreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const playBarShowing = useTrackShowing();

    useEffect(() => {
        setNews(allNews['nnGroup'])
    }, [allNews]);

    useEffect(() => console.log('start to render nngroup'), []);

    return <FlatList
        data={news}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={refreshing} onRefresh={refreshNews}/>
        }
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{paddingBottom: playBarShowing ? 100 : 0}}
        renderItem={({item, index}) => (
            <TouchableOpacity
                style={styles.newsItemWrapper}
                onPress={() =>
                    navigation.navigate('NewsDetailScreen', {
                        url: "https://zchengb.top/api/t/" + item.shortLink,
                    })
                }
                activeOpacity={0.8}
            >
                <View style={styles.newItemContainer}>
                    <View style={styles.infoContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <View style={styles.additionalInfoContainer}>
                            <Text style={styles.additionalText}>{item.publishDate}</Text>
                            {
                                item.consumingTime
                                    ?
                                    <Text style={styles.additionalText}> | {item.consumingTime}</Text>
                                    :
                                    <></>
                            }
                        </View>
                        <Text style={styles.brief} numberOfLines={3}>
                            {item.brief}
                        </Text>
                    </View>
                    {
                        item.coverImage
                            ?
                            <Image
                                style={styles.coverImage}
                                resizeMode="cover"
                                source={{uri: item.coverImage}}
                            />
                            :
                            <></>
                    }
                </View>
                <View style={styles.borderBottom}/>
            </TouchableOpacity>
        )}
    />
}

const styles = StyleSheet.create({
    newsItemWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    newItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 16,
        paddingLeft: 16,
        paddingBottom: 12,
        paddingTop: 12,
        width: '100%',
        maxHeight: 152,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    additionalInfoContainer: {
        marginTop: 6,
        flexDirection: 'row',
    },
    additionalText: {
        fontSize: 14,
        color: 'rgba(0,0,0,0.35)'
    },
    borderBottom: {
        borderBottomColor: 'rgba(0,0,0,0.08)',
        borderBottomWidth: 1,
        width: '94%',
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(0,0,0,0.85)',
        lineHeight: 20
    },
    brief: {
        marginTop: 6,
        fontSize: 14,
        color: 'rgba(0,0,0,0.65)',
        lineHeight: 20
    },
    coverImage: {
        marginLeft: 16,
        width: 120,
        height: 88
    }
})