import {useNavigation} from "@react-navigation/native";
import {useTheme} from '@rneui/themed';
import React, {useEffect, useState} from "react";
import {FlatList, Image, RefreshControl, StyleSheet, View} from "react-native";
import {Text} from "../components/Text";
import {globalStyles} from "../globalStyle";
import useNewsStore from '../stores/useNewsStore';
import {useDarkMode} from "../hooks/DarkModeHooks";
import {PressableNewsItem} from "../components/PressableNewsItem";

export const Zhihu = () => {
    const normalNews = useNewsStore(state => state.normalNews);
    const normalRefreshing = useNewsStore(state => state.normalRefreshing);
    const refreshNews = useNewsStore(state => state.refreshNews);
    
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();

    useEffect(() => {
        setNews(normalNews['zhihu'])
    }, [normalNews]);

    const formatTwoDigits = (number) => {
        return Number(number).toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false});
    }

    useEffect(() => console.log('start to render zhihu'), []);

    return <FlatList
        data={news}
        directionalLockEnabled={true}
        scrollEventThrottle={16}
        contentContainerStyle={styles.contentContainer}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews} tintColor={isDarkMode ? '#d77f31' : ''}/>
        }
        renderItem={({item, index}) => (
            <PressableNewsItem
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
            </PressableNewsItem>
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