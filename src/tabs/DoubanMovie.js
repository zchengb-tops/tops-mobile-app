import {FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View} from "react-native";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../providers/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import {Rating} from "react-native-ratings";
import {globalStyles} from "../globalStyle";
import {Text} from "../components/Text";
import { useTheme } from '@rneui/themed';
import {useDarkMode} from "../hooks/DarkModeHooks";

export const DoubanMovie = () => {
    const {normalNews, normalRefreshing, refreshNews} = useContext(NewsContext);
    const [movies, setMovies] = useState([]);
    const navigation = useNavigation();
    const { theme } = useTheme();
    const darkMode = useDarkMode();

    useEffect(() => {
        setMovies(normalNews['doubanMovie'])
    }, [normalNews]);

    useEffect(() => console.log('start to render douban'), []);

    return <FlatList
        style={styles.container}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews} />
        }
        data={movies}
        contentContainerStyle={styles.contentContainer}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => {
            const numericRate = parseFloat(item.rate);
            const rate = numericRate / 2;

            return (
                <TouchableOpacity
                    style={styles.movieItem}
                    activeOpacity={0.8}
                    onPress={() =>
                        navigation.navigate('NewsDetailScreen', {
                            url: item.link,
                            title: item.title
                        })
                    }
                >
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
                    <Image style={styles.cover} source={{uri: item.coverUrl}}/>
                    <View style={styles.movieInfoWrapper}>
                        <Text style={[styles.movieName, { color: theme.colors.text }]}>{item.name}</Text>
                        <View style={styles.additionalInfoWrapper}>
                            <Text style={[styles.additionalText, { color: theme.colors.secondaryText }]}>{item.publishDate} / </Text>
                            <Text style={[styles.additionalText, { color: theme.colors.secondaryText }]}>{item.region} / </Text>
                            <Text
                                style={[styles.additionalText, styles.movieTypeText, { color: theme.colors.secondaryText }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.type}
                            </Text>
                        </View>
                        <View style={styles.rankWrapper}>
                            <Rating
                                readonly
                                startingValue={rate}
                                tintColor={darkMode ? theme.colors.background : null}
                                imageSize={16}
                                fractions={1}
                            />
                            <Text style={styles.rankText}>{item.rate}</Text>
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
    },
    cover: {
        borderRadius: 8,
        width: 80,
        height: 120,
        marginLeft: 12,
    },
    movieItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        height: 152,
    },
    rankNumCircle: {
        width: 18,
        height: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f1f4',
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
    },
    movieInfoWrapper: {
        marginLeft: 16,
        flex: 1,
        height: '100%',
        justifyContent: 'space-around'
    },
    additionalInfoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    additionalText: {
        fontSize: 12,
        color: '#939393',
    },
    movieTypeText: {
        flexShrink: 1,
    },
    movieName: {
        fontSize: 16,
    },
    rankWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#F1C30F',
        fontWeight: '500'
    }
})