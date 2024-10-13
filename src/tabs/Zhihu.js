import {FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../providers/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import {globalStyles} from "../globalStyle";

export const Zhihu = () => {
    const {allNews, refreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        setNews(allNews['zhihu'])
    }, [allNews]);

    const formatTwoDigits = (number) => {
        return Number(number).toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false});
    }

    useEffect(() => console.log('start to render zhihu'), []);

    return <FlatList
        data={news}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={refreshing} onRefresh={refreshNews}/>
        }
        renderItem={({item, index}) => (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('NewsDetailScreen', {url: "https://zchengb.top/api/t/" + item.shortLink})}
            >
                <View style={styles.newsItemWrapper}>
                    <View style={styles.newItemContainer}>
                        <View style={styles.rankContainer}>
                            <Text
                                style={index < 3 ? styles[`rankNumTop${index + 1}`] : styles.rankNumText}>
                                {formatTwoDigits(item.rankNum)}
                            </Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text
                                style={styles.title}
                                numberOfLines={4}
                                ellipsizeMode='tail'>
                                {item.title}
                            </Text>
                            <Text style={styles.viewerText}>{item.properties.metrics}</Text>
                        </View>
                        {item.properties.banner !== 'https://zchengb-images.oss-cn-shenzhen.aliyuncs.com/1.jpeg' && (
                            <Image
                                style={styles.image}
                                resizeMode="cover"
                                source={{uri: item.properties.banner}}
                            />
                        )}
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
    title: {
        fontSize: 16,
        color: '#464646',
        lineHeight: 16 * 1.5,
    },
    viewerText: {
        color: '#939393',
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