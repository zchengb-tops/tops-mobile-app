import { useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { globalStyles } from "../globalStyle";
import { NewsContext } from "../providers/NewsProvider";
import { Text } from "../components/Text";
import { useTheme } from '@rneui/themed';

export const Rss = ({rssUrl}) => {
    const {rssNews, rssRefreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const { theme } = useTheme();
    useEffect(() => {
        setNews(rssNews[rssUrl]?.items || [])
    }, [rssNews]);

    const isAllNewsInSameDay = () => {
        const items = rssNews[rssUrl]?.items || [];
        if (items.length === 0) {
          return false;
        }
  
        const firstDate = new Date(items[0].publishDate);
        const firstYear = firstDate.getFullYear();
        const firstMonth = firstDate.getMonth();
        const firstDay = firstDate.getDate();
  
        for (let i = 1; i < items.length; i++) {
          const currentDate = new Date(items[i].publishDate);
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth();
          const currentDay = currentDate.getDate();
  
          if (currentYear !== firstYear || currentMonth !== firstMonth || currentDay !== firstDay) {
            return false;
          }
        }
  
        return true;
    }

    const formatDate = (originDate) => {
        if (!originDate) {
            return "";
        }
    
        const date = new Date(originDate);
        if (isAllNewsInSameDay()) {
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            return `${hours}:${minutes}`;
          } else {
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${month}-${day}`;
          }
    }

    return <FlatList
        initialNumToRender={20}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={rssRefreshing} onRefresh={refreshNews}/>
        }
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        data={news}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => {
            return (
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.newsItem}
                    onPress={() =>
                        navigation.navigate('NewsDetailScreen', {
                            url: item.link,
                            title: item.title
                        })
                    }
                >
                    <View style={styles.newsInfoWrapper}>
                        <View style={styles.newsItemIndicator}/>
                        <View style={styles.titleWrapper}>
                            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                                {item.title}
                            </Text>
                            <Text style={[styles.publishDate, { color: theme.colors.secondaryText }]}>{formatDate(item.publishDate)}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
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
        paddingBottom: 48
    },
    newsItem: {
        flex: 1,
        minHeight: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 10,
        marginBottom: 12,
    },
    newsInfoWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    title: {
        flex: 1,
        fontSize: 16,
    },
    newsItemIndicator: {
        width: 8,
        height: 8,
        borderRadius: 12,
        backgroundColor: '#E57700',
        marginRight: 12,
    },
    publishDate: {
        fontSize: 14,
        marginLeft: 8,
    },
})