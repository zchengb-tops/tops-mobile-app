import {useNavigation} from "@react-navigation/native";
import {useTheme} from '@rneui/themed';
import React, {useEffect, useState} from "react";
import {FlatList, RefreshControl, StyleSheet, View} from "react-native";
import {Text} from "../components/Text";
import {globalStyles} from "../globalStyle";
import useNewsStore from '../stores/useNewsStore';
import {useDarkMode} from "../hooks/DarkModeHooks";
import {PressableNewsItem} from "../components/PressableNewsItem";

export const Sina = () => {
    const normalNews = useNewsStore(state => state.normalNews);
    const refreshNews = useNewsStore(state => state.refreshNews);
    const normalRefreshing = useNewsStore(state => state.normalRefreshing);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();

    useEffect(() => {
        setNews(normalNews['sina'])
    }, [normalNews]);

    const prettifyNumber = (viewers) => {
        viewers = Number(viewers);
        if (viewers >= 100000000) {
            viewers = Math.round(viewers / 10000000) / 10 + "亿";
        } else if (viewers >= 10000) {
            viewers = Math.round(viewers / 1000) / 10 + "万";
        }
        return viewers;
    }

    useEffect(() => console.log('start to render sina'), []);

    return <FlatList
        initialNumToRender={20}
        directionalLockEnabled={true}
        scrollEventThrottle={16}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews} tintColor={isDarkMode ? '#d77f31' : ''}/>
        }
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        data={news}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => {
            return (
                <PressableNewsItem
                    style={styles.newsItem}
                    onPress={() => navigation.navigate('NewsDetailScreen', {
                        url: item.link,
                        title: item.title,
                        useTitleForShare: true
                    })}
                >
                    <View style={styles.newsInfoWrapper}>
                        <View
                            style={[
                                styles.rankNumCircle,
                                index < 3 && styles[`rankNumCircleTop${index + 1}`],
                            ]}
                        >
                            <Text style={index < 3 ? styles.topRankNumText : styles.rankNumText}>
                                {item.rankNum}
                            </Text>
                        </View>
                        <Text style={[styles.title, { color: theme.colors.text }]}
                              numberOfLines={1}
                              ellipsizeMode="tail">
                            {item.title}
                        </Text>
                    </View>
                    <Text style={[styles.viewerText, { color: theme.colors.secondaryText }]}>
                        {prettifyNumber(item.properties.viewers)}
                    </Text>
                </PressableNewsItem>
            );
        }}
    />
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        marginTop: 4,
    },
    newsItem: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 10,
        marginBottom: 12,
    },
    newsInfoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '84%'
    },
    title: {
        marginLeft: 16,
        fontSize: 16,
    },
    viewerText: {
        fontSize: 14,
    },
    rankNumCircle: {
        width: 18,
        height: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f1f4',
        marginRight: -6,
    },
    rankNumCircleTop1: {
        backgroundColor: '#E67700',
        color: 'white',
    },
    rankNumCircleTop2: {
        backgroundColor: '#F59F00',
        color: 'white',
    },
    rankNumCircleTop3: {
        backgroundColor: '#FCC419',
        color: 'white',
    },
    rankNumText: {
        color: 'rgba(0, 0, 0, 0.8)',
        fontSize: 12
    },
    topRankNumText: {
        color: 'white',
        fontSize: 12
    }
})