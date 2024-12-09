import {FlatList, RefreshControl, StyleSheet, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../providers/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import {globalStyles} from "../globalStyle";
import {Text} from "../components/Text";
import { useTheme } from '@rneui/themed';

export const History = () => {
    const { theme } = useTheme();
    const {normalNews, normalRefreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        setNews(normalNews['history'])
    }, [normalNews]);

    useEffect(() => console.log('start to render tiobe'), []);

    const renderItem = (item, index) => {
        return (
            <TouchableOpacity style={[styles.itemWrapper]}
                              activeOpacity={0.8}
                              onPress={() => navigation.navigate('NewsDetailScreen', {
                                  url: process.env.EXPO_PUBLIC_API_URL + "/t/" + item.shortLink,
                                  title: item.title
                              })}
            >
                <View style={styles.symbol}/>
                <View style={styles.textInfoWrapper}>
                    <Text style={[styles.year, { color: theme.colors.secondaryText }]}>{item.year}年</Text>
                    <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
                    <Text style={[styles.desc, { color: theme.colors.secondaryText }]}>
                        {item.desc}
                        {item.desc?.endsWith("...") && <Text style={[styles.moreText, { color: theme.colors.primary }]}>&nbsp;更多&gt;&gt;</Text>}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }


    return <FlatList
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { borderLeftColor: theme.colors.border }]}
        initialNumToRender={20}
        data={news}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews}/>
        }
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => renderItem(item, index)}
    />
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.08)',
        marginTop: 20,
        marginRight: 16,
        marginLeft: 28,
        paddingBottom: 48
    },
    itemWrapper: {
        position: 'relative',
        alignItems: "flex-start",
        marginBottom: 24,
    },
    symbol: {
        position: 'absolute',
        left: 0,
        top: 4,
        transform: [
            {translateX: -4},
            {translateY: -4},
        ],
        width: 8,
        height: 8,
        borderRadius: 12,
        backgroundColor: '#E46603',
    },
    textInfoWrapper: {
        transform: [
            {translateY: -4}
        ]
    },
    year: {
        fontSize: 14,
        color: '#939393',
        marginLeft: 16
    },
    title: {
        fontSize: 16,
        lineHeight: 20,
        marginLeft: 16,
        marginTop: 8
    },
    desc: {
        fontSize: 14,
        marginLeft: 16,
        marginTop: 8,
        lineHeight: 20
    },
    moreText: {
    }
})