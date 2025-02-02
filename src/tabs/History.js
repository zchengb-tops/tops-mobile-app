import {useNavigation} from "@react-navigation/native";
import {useTheme} from '@rneui/themed';
import React, {useEffect, useState} from "react";
import {RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View} from "react-native";
import {Text} from "../components/Text";
import {globalStyles} from "../globalStyle";
import useNewsStore from '../stores/useNewsStore';
import {useDarkMode} from "../hooks/DarkModeHooks";

export const History = () => {
    const normalNews = useNewsStore(state => state.normalNews);
    const normalRefreshing = useNewsStore(state => state.normalRefreshing);
    const refreshNews = useNewsStore(state => state.refreshNews);
    
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();

    useEffect(() => {
        setNews(normalNews['history'])
    }, [normalNews]);

    useEffect(() => console.log('start to render tiobe'), []);

    const renderItem = (item, index) => {
        return (
            <TouchableOpacity style={[styles.itemWrapper]}
                delayPressIn={200}
                key={index}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('NewsDetailScreen', {
                    url: item.link,
                    title: item.title
                })}
            >
                <View style={styles.symbol} />
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


    return <ScrollView
        style={styles.container}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews} tintColor={isDarkMode ? '#d77f31' : ''}/>
        }
    >
        <View style={[styles.contentContainer, {borderLeftColor: theme.colors.border}]}>
            {news.map((item, index) => renderItem(item, index))}
        </View>
    </ScrollView>
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
            { translateX: -4 },
            { translateY: -4 },
        ],
        width: 8,
        height: 8,
        borderRadius: 12,
        backgroundColor: '#E46603',
        zIndex: 1,
    },
    textInfoWrapper: {
        transform: [
            { translateY: -4 }
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