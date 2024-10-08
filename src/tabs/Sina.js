import {FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {ListItem} from "@rneui/themed";
import React, {useContext, useEffect, useState} from "react";
import {NewsContext} from "../../utils/NewsProvider";
import {useNavigation} from "@react-navigation/native";
import {useTrackShowing} from "../hooks/TrackHooks";
import {globalStyles} from "../globalStyle";

export const Sina = () => {
    const {allNews, refreshing, refreshNews} = useContext(NewsContext);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const playBarShowing = useTrackShowing();

    useEffect(() => {
        setNews(allNews['sina'])
    }, [allNews]);

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
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={refreshing} onRefresh={refreshNews} />
        }
        data={news}
        contentContainerStyle={{paddingBottom: playBarShowing ? 100: 0}}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => {
            return (
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate('NewsDetailScreen', {
                            url: "https://zchengb.top/api/t/" + item.shortLink,
                        })
                    }
                >
                    <ListItem containerStyle={styles.newItemContainer}>
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
                        <ListItem.Content>
                            <ListItem.Title
                                style={styles.title}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.title}
                            </ListItem.Title>
                        </ListItem.Content>
                        <Text style={styles.viewerText}>
                            {prettifyNumber(item.properties.viewers)}
                        </Text>
                    </ListItem>
                </TouchableOpacity>
            );
        }}
    />
}

const styles = StyleSheet.create({
    newItemContainer: {
        marginBottom: -4,
    },
    title: {
        fontSize: 16,
        color: 'rgba(0,0,0,0.85)'
    },
    viewerText: {
        color: '#939393',
        fontSize: 14
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