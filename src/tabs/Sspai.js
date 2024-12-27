import {FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../providers/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import FlashlightIcon from "../../assets/icons/flashlight.svg";
import CommentIcon from "../../assets/icons/comment.svg";
import {globalStyles} from "../globalStyle";
import {Text} from "../components/Text";
import { useTheme } from '@rneui/themed';

export const Sspai = () => {
    const {normalNews, normalRefreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const { theme } = useTheme();
    useEffect(() => {
        setNews(normalNews['sspai'])
    }, [normalNews]);

    const getArticleTitle = article => {
        const morningPaperPrefix = "派早报";
        if (article.morningPaper) {
            let title = article.title.replace(morningPaperPrefix + "：", "");
            title = title.replace(morningPaperPrefix + ":", "");

            return <Text style={[styles.morningTitle, { color: theme.colors.text }]} numberOfLines={3} ellipsizeMode='tail'>
                <Text style={styles.morningTitlePrefix}>派早报：</Text>
                {title}
            </Text>
        }
        return <Text style={[styles.normalTitle, { color: theme.colors.text }]} numberOfLines={3} ellipsizeMode='tail'>{article.title}</Text>
    }

    useEffect(() => console.log('start to render sspai'), []);

    return <FlatList
        data={news}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews} tintColor={theme.colors.indicator}/>
        }
        contentContainerStyle={styles.contentContainer}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                    navigation.navigate('NewsDetailScreen', {
                        url: item.link,
                        title: item.title
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
                                <Text style={[styles.publishDate, { color: theme.colors.secondaryText }]}>{item.publishDate}</Text>
                                <View style={styles.countWrapper}>
                                    <View style={styles.likeWrapper}>
                                        <FlashlightIcon/>
                                        <Text style={[styles.likeCount, { color: theme.colors.secondaryText }]}>{item.likeCount}</Text>
                                    </View>
                                    <View style={styles.commentWrapper}>
                                        <CommentIcon/>
                                        <Text style={[styles.commentCount, { color: theme.colors.secondaryText }]}>{item.commentCount}</Text>
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
    contentContainer: {
    },
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
        lineHeight: 16 * 1.5,
    },
    morningTitlePrefix: {
        color: '#DF4849'
    },
    normalTitle: {
        fontSize: 16,
        color: '#464646',
        lineHeight: 16 * 1.5,
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