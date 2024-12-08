import {FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../providers/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import {globalStyles} from "../globalStyle";
import CoverPlayIcon from "../../assets/icons/cover-play.svg"

export const NnGroup = () => {
    const {normalNews, normalRefreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        setNews(normalNews['nnGroup'])
    }, [normalNews]);

    useEffect(() => console.log('start to render nngroup'), []);

    return <FlatList
        data={news}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews}/>
        }
        contentContainerStyle={styles.contentContainer}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => (
            <TouchableOpacity
                style={styles.newsItemWrapper}
                onPress={() =>
                    navigation.navigate('NewsDetailScreen', {
                        url: process.env.EXPO_PUBLIC_API_URL + "/t/" + item.shortLink,
                        title: item.title
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
                            <View style={styles.coverImageWrapper}>
                                <Image
                                    style={styles.coverImage}
                                    resizeMode="cover"
                                    source={{uri: item.coverImage}}
                                />
                                <CoverPlayIcon width={36} height={36} style={styles.coverPlayIcon}
                                               color={"rgba(0,0,0,0.6)"}/>
                            </View>
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
    contentContainer: {
        paddingBottom: 48
    },
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
    coverImageWrapper: {
        position: 'relative',
        marginLeft: 12,
        width: 120,
        height: 88
    },
    coverImage: {
        width: 120,
        height: 88
    },
    coverPlayIcon: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform:  [
            { translateX: -18 },
            { translateY: -18 },
        ],
    },
})