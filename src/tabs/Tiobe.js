import {useNavigation} from "@react-navigation/native";
import React, {useEffect, useState} from "react";
import {FlatList, RefreshControl, StyleSheet, TouchableOpacity, View} from "react-native";
import {globalStyles} from "../globalStyle";
import {Text} from "../components/Text";
import {useTheme} from '@rneui/themed';
import useNewsStore from '../stores/useNewsStore';
import {useDarkMode} from "../hooks/DarkModeHooks";

export const Tiobe = () => {
    const normalNews = useNewsStore(state => state.normalNews);
    const normalRefreshing = useNewsStore(state => state.normalRefreshing);
    const refreshNews = useNewsStore(state => state.refreshNews);
    const [news, setNews] = useState([]);
    const navigation = useNavigation();
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();
    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    useEffect(() => {
        setNews(normalNews['tiobe'])
    }, [normalNews]);

    useEffect(() => console.log('start to render tiobe'), []);

    const getCurrentMonthLabel = () => {
        const date = new Date();
        return month[date.getMonth()] + " " + date.getFullYear();
    }

    const getMonthOfLastYearLabel = () => {
        const date = new Date();
        return month[date.getMonth()] + " " + (date.getFullYear() - 1);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={[styles.headerText, styles.rankCol]}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5} numberOfLines={1}>{getCurrentMonthLabel()}</Text>
            <Text style={[styles.headerText, styles.rankLastYearCol]}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5} numberOfLines={1}>{getMonthOfLastYearLabel()}</Text>
            <Text style={[styles.headerText, styles.languageCol]}>语言</Text>
            <Text style={[styles.headerText, styles.percentageCol]}>占比</Text>
            <Text style={[styles.headerText, styles.changeCol]}>变化</Text>
        </View>
    );

    const renderItem = (item, index) => {
        return (
            <TouchableOpacity style={[styles.itemWrapper, {borderBottomColor: theme.colors.border}]}
                              delayPressIn={200}
                              activeOpacity={0.8}
                              onPress={() => navigation.navigate('NewsDetailScreen', {
                                  url: item.link,
                                  title: item.title
                              })}
            >
                <Text style={[styles.itemText, styles.rankCol, {color: theme.colors.text}]}>{item.rankNum}</Text>
                <Text
                    style={[styles.itemText, styles.rankLastYearCol, {color: theme.colors.text}]}>{item.properties.rankOfMonthLastYear}</Text>
                <Text
                    style={[styles.itemText, styles.languageCol, styles.languageText, {color: theme.colors.text}]}>{item.title}</Text>
                <Text
                    style={[styles.itemText, styles.percentageCol, {color: theme.colors.text}]}>{item.properties.ratings}</Text>
                <Text
                    style={[styles.itemText, styles.changeCol, {color: item.properties.isUp ? 'green' : 'red'}]}>{item.properties.change}</Text>
            </TouchableOpacity>
        );
    }


    return <FlatList
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        initialNumToRender={20}
        data={news}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews}
                            tintColor={isDarkMode ? '#d77f31' : ''}/>
        }
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({item, index}) => renderItem(item, index)}
    />
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {},
    header: {
        flexDirection: 'row',
        marginTop: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: 'space-around',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    headerText: {
        color: '#939393',
        fontSize: 14,
        textAlign: 'center',
    },
    itemWrapper: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
    },
    itemText: {
        fontSize: 14,
    },
    rankCol: {
        flexBasis: 40,
        textAlign: 'center',
    },
    rankLastYearCol: {
        flexBasis: 40,
        textAlign: 'center',
    },
    languageCol: {
        flexBasis: 100,
        textAlign: 'center',
    },
    languageText: {
        fontWeight: '500'
    },
    percentageCol: {
        flexBasis: 60,
        textAlign: 'center',
    },
    changeCol: {
        flexBasis: 60,
        textAlign: 'center',
    },
})