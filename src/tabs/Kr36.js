import {useNavigation} from "@react-navigation/native";
import {Icon, useTheme} from "@rneui/themed";
import React from "react";
import {FlatList, Image, RefreshControl, StyleSheet, View} from "react-native";
import AuthorIcon from "../../assets/icons/author.svg";
import {Text} from "../components/Text";
import {PressableNewsItem} from "../components/PressableNewsItem";
import {Kr36Logo} from "../components/Kr36Logo";
import {globalStyles} from "../globalStyle";
import {useDarkMode} from "../hooks/DarkModeHooks";
import useNewsStore from "../stores/useNewsStore";

export const Kr36 = () => {
    const normalNews = useNewsStore(state => state.normalNews);
    const normalRefreshing = useNewsStore(state => state.normalRefreshing);
    const refreshNews = useNewsStore(state => state.refreshNews);
    const navigation = useNavigation();
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();
    const news = normalNews?.["36kr"] || [];
    const publicationTime = item => {
        const value = item.properties?.publishDate || item.properties?.publishTime || "";
        if (!value) {
            return value;
        }
        const now = new Date();
        const timestamp = Number(value);
        let date;
        if (Number.isFinite(timestamp) && timestamp >= 100000000000) {
            date = new Date(timestamp);
        } else {
            const shortDate = /^(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(String(value).trim());
            if (shortDate) {
                date = new Date(
                    now.getFullYear(),
                    Number(shortDate[1]) - 1,
                    Number(shortDate[2]),
                    Number(shortDate[3]),
                    Number(shortDate[4])
                );
                if (date > now) {
                    date.setFullYear(date.getFullYear() - 1);
                }
            } else {
                date = new Date(String(value).replace(" ", "T"));
            }
        }
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        const pad = number => String(number).padStart(2, "0");
        const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
        const isSameDay = date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = date.getFullYear() === yesterday.getFullYear() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getDate() === yesterday.getDate();

        if (isSameDay) {
            return `今天 ${time}`;
        }
        if (isYesterday) {
            return `昨天 ${time}`;
        }
        return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${time}`;
    };

    return (
        <FlatList
            data={news}
            directionalLockEnabled={true}
            scrollEventThrottle={16}
            refreshControl={
                <RefreshControl
                    style={globalStyles.refreshControl}
                    refreshing={normalRefreshing}
                    onRefresh={refreshNews}
                    tintColor={isDarkMode ? "#d77f31" : ""}
                />
            }
            contentContainerStyle={styles.contentContainer}
            keyExtractor={(item, index) => item.shortLink || `${item.rankNum}-${index}`}
            renderItem={({item}) => (
                <PressableNewsItem
                    style={[styles.newsItemWrapper, {
                        backgroundColor: theme.colors.inputBackground,
                        borderColor: theme.colors.border
                    }]}
                    onPress={() => navigation.navigate("NewsDetailScreen", {
                        url: item.link,
                        title: item.title
                    })}
                >
                    <View style={styles.itemContainer}>
                        {item.properties?.cover ? (
                            <Image
                                style={styles.cover}
                                resizeMode="cover"
                                source={{uri: item.properties.cover}}
                            />
                        ) : <View style={[styles.coverFallback, {backgroundColor: isDarkMode ? '#493426' : '#fff2e8'}]}><Kr36Logo size={28}/></View>}
                        <View style={styles.infoContainer}>
                            <Text style={[styles.articleTitle, {color: theme.colors.text}]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            {item.properties?.summary ? (
                                <Text style={[styles.summary, {color: theme.colors.secondaryText}]} numberOfLines={1}>
                                    {item.properties.summary}
                                </Text>
                            ) : null}
                            {(item.properties?.board || item.properties?.author || publicationTime(item)) ? (
                                <View style={styles.metaContainer}>
                                    {item.properties?.board ? <Text
                                        style={[styles.board, {color: theme.colors.secondaryText}]}
                                    >#{item.properties.board}</Text> : null}
                                    {item.properties?.author ? (
                                        <View style={styles.authorMeta}>
                                            <AuthorIcon width={12} height={12}/>
                                            <Text style={[styles.meta, {color: theme.colors.secondaryText}]} numberOfLines={1}>
                                                {item.properties.author}
                                            </Text>
                                        </View>
                                    ) : null}
                                    {publicationTime(item) ? (
                                        <View style={styles.publishMeta}>
                                            <Icon
                                                name="time-outline"
                                                type="ionicon"
                                                size={12}
                                                color={theme.colors.secondaryText}
                                            />
                                            <Text style={[styles.publish, {color: theme.colors.secondaryText}]} numberOfLines={1}>
                                                {publicationTime(item)}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            ) : null}
                        </View>
                    </View>
                </PressableNewsItem>
            )}
        />
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        paddingBottom: 20,
    },
    newsItemWrapper: {
        alignItems: "center",
        borderRadius: 4,
        marginBottom: 10,
        marginHorizontal: 16,
        overflow: "hidden",
    },
    itemContainer: {
        alignItems: "center",
        flexDirection: "row",
        height: 146,
        padding: 12,
        width: "100%",
    },
    infoContainer: {
        flex: 1,
        minWidth: 0,
    },
    articleTitle: {
        fontSize: 14,
        fontWeight: "500",
        lineHeight: 21,
    },
    metaContainer: {
        alignItems: "center",
        flexDirection: "row",
        marginTop: 8,
    },
    board: {
        fontSize: 11,
        fontWeight: "400",
        lineHeight: 16,
    },
    authorMeta: {
        alignItems: "center",
        flexDirection: "row",
        flexShrink: 1,
        marginLeft: 8,
    },
    meta: {
        flexShrink: 1,
        fontSize: 11,
        lineHeight: 16,
        marginLeft: 3,
    },
    publish: {
        flexShrink: 1,
        fontSize: 11,
        lineHeight: 16,
        marginLeft: 3,
    },
    publishMeta: {
        alignItems: "center",
        flexDirection: "row",
        flexShrink: 1,
        marginLeft: 8,
    },
    summary: {
        fontSize: 12,
        lineHeight: 16,
        marginTop: 8,
    },
    cover: {
        borderRadius: 4,
        height: 100,
        marginRight: 14,
        width: 160,
    },
    coverFallback: {
        alignItems: "center",
        backgroundColor: "#fff2e8",
        borderRadius: 4,
        height: 100,
        justifyContent: "center",
        marginRight: 14,
        width: 160,
    },
});
