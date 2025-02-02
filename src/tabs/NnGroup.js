import {FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View} from "react-native";
import React, {useEffect, useState} from "react";
import {useNavigation} from "@react-navigation/native";
import {globalStyles} from "../globalStyle";
import CoverPlayIcon from "../../assets/icons/cover-play.svg"
import {Text} from "../components/Text";
import {useTheme} from '@rneui/themed';
import useNewsStore from '../stores/useNewsStore';
import {useDarkMode} from "../hooks/DarkModeHooks";

export const NnGroup = () => {
    const normalNews = useNewsStore(state => state.normalNews);
    const normalRefreshing = useNewsStore(state => state.normalRefreshing);
    const refreshNews = useNewsStore(state => state.refreshNews);

    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();

    useEffect(() => {
        setNews(normalNews['nnGroup'])
    }, [normalNews]);

    useEffect(() => console.log('start to render nngroup'), []);

    return <FlatList
        data={news}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews}
                            tintColor={isDarkMode ? '#d77f31' : ''}/>
        }
        contentContainerStyle={styles.contentContainer}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => (
            <TouchableOpacity
                delayPressIn={200}
                style={styles.newsItemWrapper}
                onPress={() =>
                    navigation.navigate('NewsDetailScreen', {
                        url: item.link,
                        title: item.title
                    })
                }
                activeOpacity={0.8}
            >
                <View style={styles.newItemContainer}>
                    <View style={styles.infoContainer}>
                        <Text style={[styles.title, {color: theme.colors.text}]} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.additionalInfoContainer}>
                            <Text
                                style={[styles.additionalText, {color: theme.colors.secondaryText}]}>{item.publishDate}</Text>
                            {
                                item.consumingTime
                                    ?
                                    <Text
                                        style={[styles.additionalText, {color: theme.colors.secondaryText}]}> | {item.consumingTime}</Text>
                                    :
                                    <></>
                            }
                        </View>
                        <Text style={[styles.brief, {color: theme.colors.secondaryText}]} numberOfLines={3}>
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
                <View style={[styles.borderBottom, {borderBottomColor: theme.colors.border}]}/>
            </TouchableOpacity>
        )}
    />
}

const styles = StyleSheet.create({
    contentContainer: {},
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
    },
    borderBottom: {
        borderBottomWidth: 1,
        width: '94%',
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
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
        transform: [
            {translateX: -18},
            {translateY: -18},
        ],
    },
})