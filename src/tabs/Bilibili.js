import {FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../providers/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import AuthorIcon from "../../assets/icons/author.svg"
import ViewIcon from "../../assets/icons/view.svg"
import LikeIcon from "../../assets/icons/like.svg"
import {globalStyles} from "../globalStyle";

export const Bilibili = () => {
    const {normalNews, normalRefreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        setNews(normalNews['bilibili'])
    }, [normalNews]);

    useEffect(() => console.log('start to render bilibili'), []);

    const prettifyNumber = (number) => {
        number = Number(number);
        if (number >= 100000000) {
            number = Math.round(number / 10000000) / 10 + "亿";
        } else if (number >= 10000) {
            number = Math.round(number / 1000) / 10 + "万";
        }
        return number;
    }

    return <FlatList
        style={styles.container}
        data={news}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews}/>
        }
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => {
            return <TouchableOpacity style={[styles.itemWrapper, {marginTop: index === 0 ? 16 : 8}]}
                                     activeOpacity={0.8}
                                     onPress={() => navigation.navigate('NewsDetailScreen', {
                                         url: process.env.EXPO_PUBLIC_API_URL + item.shortLink,
                                         title: item.title
                                     })}
            >
                <Image style={styles.cover} source={{uri: item.properties.firstFrame.replace('http://', 'https://')}}/>
                <View style={styles.itemInfoWrapper}>
                    <Text style={styles.title} numberOfLines={2} ellipsizeMode='tail'>{item.title}</Text>
                    <View>
                        <View style={styles.authorInfoWrapper}>
                            <View style={styles.iconItemWrapper}>
                                <AuthorIcon width={12} height={12}/>
                                <Text style={styles.infoText} numberOfLines={1}
                                      ellipsizeMode='tail'>{item.properties.owner}</Text>
                            </View>
                        </View>
                        <View style={styles.statisticInfoWrapper}>
                            <View style={styles.iconItemWrapper}>
                                <ViewIcon width={12} height={12}/>
                                <Text style={styles.infoText}>{prettifyNumber(item.properties.view)}</Text>
                            </View>

                            <View style={styles.iconItemWrapper}>
                                <LikeIcon width={12} height={12}/>
                                <Text style={styles.infoText}>{prettifyNumber(item.properties.like)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        }}
    />
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    itemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 12,
    },
    cover: {
        width: 150,
        height: 90,
        zIndex: 1,
        marginRight: 10,
        borderRadius: 8
    },
    title: {
        color: '#464646',
        fontSize: 14,
        lineHeight: 18,
    },
    infoText: {
        color: '#939393',
        fontSize: 12,
        marginLeft: 2,
    },
    itemInfoWrapper: {
        flex: 1,
        height: 90,
        justifyContent: 'space-between'
    },
    statisticInfoWrapper: {
        marginTop: 8,
        flexDirection: 'row'
    },
    authorInfoWrapper: {
        flexDirection: 'row',
    },
    iconItemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    }
})