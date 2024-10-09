import {FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../../utils/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import FlashlightIcon from "../../assets/icons/flashlight.svg";
import CommentIcon from "../../assets/icons/comment.svg";
import {useTrackShowing} from "../hooks/TrackHooks";
import {globalStyles} from "../globalStyle";

export const Sspai = () => {
    const {allNews, refreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const playBarShowing = useTrackShowing();

    useEffect(() => {
        setNews(allNews['sspai'])
    }, [allNews]);

    const getArticleTitle = article => {
        const morningPaperPrefix = "派早报";
        if (article.morningPaper) {
            let title = article.title.replace(morningPaperPrefix + "：", "");
            title = title.replace(morningPaperPrefix + ":", "");

            return <Text style={styles.morningTitle} numberOfLines={3} ellipsizeMode='tail'>
                <Text style={styles.morningTitlePrefix}>派早报：</Text>
                {title}
            </Text>
        }
        return <Text style={styles.normalTitle} numberOfLines={3} ellipsizeMode='tail'>{article.title}</Text>
    }

    useEffect(() => console.log('start to render sspai'), []);

    return <FlatList
        data={news}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={refreshing} onRefresh={refreshNews}/>
        }
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{paddingBottom: playBarShowing ? 100 : 0}}
        renderItem={({item, index}) => (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                    navigation.navigate('NewsDetailScreen', {
                        url: "https://zchengb.top/api/t/" + item.shortLink,
                    })
                }
            >
                <View style={styles.newsItemWrapper}>
                    <View style={styles.newItemContainer}>
                        <Image
                            style={styles.image}
                            resizeMode="cover"
                            source={{uri: item.banner}}
                        />

                        <View style={styles.textContainer}>
                            {getArticleTitle(item)}
                            <View style={styles.infoWrapper}>
                                <Text style={styles.publishDate}>{item.publishDate}</Text>
                                <View style={styles.countWrapper}>
                                    <View style={styles.likeWrapper}>
                                        <FlashlightIcon/>
                                        <Text style={styles.likeCount}>{item.likeCount}</Text>
                                    </View>
                                    <View style={styles.commentWrapper}>
                                        <CommentIcon/>
                                        <Text style={styles.commentCount}>{item.commentCount}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={styles.borderBottom}/>
                </View>
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
        padding: 12,
        height: 146
    },
    borderBottom: {
        borderBottomColor: 'rgba(0,0,0,0.08)',
        borderBottomWidth: 1,
        width: '94%',
    },
    rankContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    morningTitle: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 16 * 1.5,
    },
    morningTitlePrefix: {
        color: '#DF4849'
    },
    normalTitle: {
        fontSize: 16,
        color: 'rgba(0,0,0,0.85)',
        lineHeight: 16 * 1.5,
        fontWeight: '500'
    },
    infoWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12
    },
    publishDate: {
        color: '#939393',
        fontSize: 14,
    },
    countWrapper: {
        flexDirection: 'row',
    },
    likeWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    likeCount: {
        color: '#939393',
        fontSize: 14,
        marginLeft: 2
    },
    commentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentCount: {
        color: '#939393',
        fontSize: 14,
        marginLeft: 4
    },
    image: {
        width: 140,
        height: 100,
        marginRight: 14,
    },
})