import React, {useContext, useEffect, useRef, useState} from "react";
import {ActivityIndicator, Dimensions, RefreshControl, SafeAreaView, ScrollView, StyleSheet, View} from 'react-native';
import {GlobalContext} from "../../utils/GlobalContext";
import {useTrackShowing} from "../hooks/TrackHooks";
import {TabBar} from "../components/TabBar";
import {ErrorScreen} from "./ErrorScreen";
import {storage} from "../storage";
import {CHANNEL_COMPONENT_MAP, DEFAULT_CHANNEL_LIST} from "../constant";
import {useIsFocused} from "@react-navigation/native";

export const DiscoveryScreen = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const {globalState, setGlobalState} = useContext(GlobalContext);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const playBarShowing = useTrackShowing();
    const [channelList, setChannelList] = useState([]);
    const isFocused = useIsFocused();
    const [loadedTabs, setLoadedTabs] = useState(new Set());
    const tabViewRef = useRef(null);
    const screenWidth = Dimensions.get('window').width;
    const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);

    useEffect(() => {
        initialChannelList();
    }, [isFocused]);

    useEffect(() => {
        const newLoadedTabs = new Set(loadedTabs);
        newLoadedTabs.add(tabIndex);
        setLoadedTabs(newLoadedTabs);
    }, [tabIndex]);

    useEffect(() => {
        fetchNews().then(() => console.log('Successfully fetch news :)'));
    }, []);

    const initialChannelList = () => {
        const stringifyChannelList = storage.getString("channelList");
        let needUseDefaultChannelList = true;
        if (stringifyChannelList) {
            const parsedChannelList = JSON.parse(stringifyChannelList);

            const hasChanges = checkChannelListChanges(parsedChannelList, channelList);

            if (parsedChannelList?.length > 0) {
                setChannelList(injectChannelComponentFields(parsedChannelList));
                needUseDefaultChannelList = false;

                if (hasChanges) {
                    setTabIndex(0);
                }
            }
        }

        if (needUseDefaultChannelList) {
            const initialChannelList = DEFAULT_CHANNEL_LIST;
            storage.set("channelList", JSON.stringify(initialChannelList));
            setChannelList(injectChannelComponentFields(initialChannelList));
        }
    }

    const checkChannelListChanges = (newList, oldList) => {
        if (newList.length !== oldList.length) {
            return true;
        }

        for (let i = 0; i < newList.length; i++) {
            const newChannel = newList[i];
            const oldChannel = oldList.find(channel => channel.id === newChannel.id);
            if (!oldChannel || newChannel.enable !== oldChannel.enable) {
                return true;
            }
        }

        return false;
    };

    const injectChannelComponentFields = (channelList) => {
        return channelList.map(channel => (
            {
                ...channel,
                renderIcon: CHANNEL_COMPONENT_MAP[channel.id]?.renderIcon,
                component: CHANNEL_COMPONENT_MAP[channel.id]?.component
            }
        ));
    }

    const fetchNews = async () => {
        setLoadError(false);
        setLoading(true);
        try {
            const response = await fetch('https://zchengb.top/api/normal-news');
            const data = await response.json();
            await setGlobalState({...globalState, news: data});
        } catch (error) {
            console.error('Error fetching news:', error);
            setLoadError(true);
        } finally {
            setLoading(false);
            console.log('loading finished', new Date())
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNews();
        setRefreshing(false);
        console.log('refresh completed.');
    };

    const visibleChannel = () => {
        return channelList.filter(channel => channel.enable);
    }

    const handleScroll = (event) => {
        if (isProgrammaticScroll) return;
        const xOffset = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(xOffset / screenWidth);

        if (newIndex !== tabIndex) {
            setTabIndex(newIndex);
        }
    };

    const changeTabIndexFromTabBar = (newIndex) => {
        if (tabViewRef.current) {
            setIsProgrammaticScroll(true);
            const screenWidth = Dimensions.get('window').width;
            tabViewRef.current.scrollTo({x: screenWidth * newIndex, animated: true});
            setTimeout(() => setIsProgrammaticScroll(false), 300);
        }
        setTabIndex(newIndex);
    }

    return <SafeAreaView style={styles.container}>
        <TabBar channelList={channelList} tabIndex={tabIndex} setTabIndex={changeTabIndexFromTabBar}/>
        <ScrollView
            ref={tabViewRef}
            horizontal
            pagingEnabled={true}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{width: screenWidth * channelList.filter(channel => channel.enable).length}}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}

        >
            {
                channelList
                    .filter(channel => channel.enable)
                    .map(
                        (channel, index) => {
                            if (loadedTabs.has(index) || Math.abs(tabIndex - index) <= 1) {
                                return (
                                    <ScrollView
                                        key={index}
                                        contentContainerStyle={{flex: 1}}
                                        style={[styles.tabView, {paddingBottom: playBarShowing ? 100 : 0}]}
                                        refreshControl={
                                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                                        }
                                    >
                                        {
                                            loadError
                                                ? <ErrorScreen fetchNews={fetchNews}/>
                                                : (loading && !refreshing
                                                        ? <View style={styles.loadingView}>
                                                            <ActivityIndicator/>
                                                        </View>
                                                        : channel.component
                                                )
                                        }
                                    </ScrollView>
                                );
                            } else {
                                return <ScrollView key={index} style={styles.tabView}/>;
                            }
                        }
                    )
            }
        </ScrollView>
    </SafeAreaView>
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tabView: {
        marginBottom: 48,
        flex: 1,
        backgroundColor: '#fffff',
    },
    tabBarIcon: {width: 16, height: 16, marginRight: 4},
    loadingView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    }
})