import {FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../providers/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import {globalStyles} from "../globalStyle";
import {Text} from "../components/Text";
import { useTheme } from '@rneui/themed';

export const Zhihu = () => {
    const {normalNews, normalRefreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const { theme } = useTheme();

    useEffect(() => {
        setNews(normalNews['zhihu'])
    }, [normalNews]);

    const formatTwoDigits = (number) => {
        return Number(number).toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false});
    }

    useEffect(() => console.log('start to render zhihu'), []);

    return <FlatList
        data={news}
        contentContainerStyle={styles.contentContainer}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews}/>
        }
        renderItem={({item, index}) => (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('NewsDetailScreen', {
                    url: item.link,
                    title: item.title
                })}
            >
                <View style={styles.newsItemWrapper}>
                    <View style={styles.newItemContainer}>
                        <View style={styles.rankContainer}>
                            <Text
                                style={index < 3 ? styles[`rankNumTop${index + 1}`] : [styles.rankNumText, { color: theme.colors.text }]}>
                                {formatTwoDigits(item.rankNum)}
                            </Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text
                                style={[styles.title, { color: theme.colors.text }]}
                                numberOfLines={4}
                                ellipsizeMode='tail'>
                                {item.title}
                            </Text>
                            <Text style={[styles.viewerText, { color: theme.colors.secondaryText }]}>{item.properties.metrics}</Text>
                        </View>
                        {item.properties.banner !== 'https://zchengb-images.oss-cn-shenzhen.aliyuncs.com/1.jpeg' && (
                            <Image
                                style={styles.image}
                                resizeMode="cover"
                                source={{uri: item.properties.banner}}
                            />
                        )}
                    </View>
                    <View style={[styles.borderBottom, { borderBottomColor: theme.colors.border }]}/>
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
    },
    borderBottom: {
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
    title: {
        fontSize: 16,
        lineHeight: 16 * 1.5,
    },
    viewerText: {
        fontSize: 14,
        marginTop: 5,
    },
    image: {
        width: 60,
        height: 60,
        marginLeft: 10,
    },
    rankNumTop1: {
        color: '#DF4849',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rankNumTop2: {
        color: '#E67700',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rankNumTop3: {
        color: '#F59F00',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rankNumText: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 16,
        fontWeight: 'bold',
    },
})