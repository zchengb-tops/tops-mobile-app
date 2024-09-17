import React, {useContext, useEffect, useState} from "react";
import {ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, View} from 'react-native';
import {TabView} from "@rneui/themed";
import {GlobalContext} from "../../utils/GlobalContext";
import {useTrackShowing} from "../hooks/TrackHooks";
import {TabBar} from "../components/TabBar";
import {ErrorScreen} from "./ErrorScreen";
import {storage} from "../storage";
import {CHANNEL_COMPONENT_MAP, DEFAULT_CHANNEL_LIST} from "../constant";

export const DiscoveryScreen = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const {globalState, setGlobalState} = useContext(GlobalContext);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const playBarShowing = useTrackShowing();
    const [channelList, setChannelList] = useState([]);

    useEffect(() => {
        const stringifyChannelList = storage.getString("channelList");
        let needUseDefaultChannelList = true;
        if (stringifyChannelList) {
            const parsedChannelList = JSON.parse(stringifyChannelList);
            if (parsedChannelList?.length > 0) {
                setChannelList(injectChannelComponentFields(parsedChannelList));
                needUseDefaultChannelList = false;
            }
        }

        if (needUseDefaultChannelList) {
            const initialChannelList = DEFAULT_CHANNEL_LIST;
            storage.set("channelList", JSON.stringify(initialChannelList));
            setChannelList(injectChannelComponentFields(initialChannelList));
        }

        fetchNews().then(() => console.log('Successfully fetch news :)'));
    }, []);

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
            setGlobalState({...globalState, news: data});
        } catch (error) {
            console.error('Error fetching news:', error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNews();
        setRefreshing(false);
        console.log('refresh completed.');
    };

    return <SafeAreaView style={styles.container}>
        <TabBar channelList={channelList} tabIndex={tabIndex} setTabIndex={setTabIndex}/>
        <TabView value={tabIndex} onChange={setTabIndex} animationType="spring" minSwipeRatio={0} minSwipeSpeed={100}>
            {
                channelList
                    .filter(channel => channel.enable)
                    .map(
                        (channel, index) => {
                            return <TabView.Item style={styles.tabView} key={index}>
                                <ScrollView
                                    contentContainerStyle={[styles.scrollView, {paddingBottom: playBarShowing ? 100 : 0}]}
                                    refreshControl={
                                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                                    }
                                >
                                    {
                                        loadError
                                            ?
                                            <ErrorScreen fetchNews={fetchNews}/>
                                            :
                                            (loading && !refreshing
                                                ?
                                                <View style={styles.loadingView}>
                                                    <ActivityIndicator/>
                                                </View>
                                                :
                                                channel.component)
                                    }
                                </ScrollView>
                            </TabView.Item>
                        }
                    )
            }
        </TabView>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tabView: {
        flex: 1,
        backgroundColor: '#fffff',
        width: '100%'
    },
    tabBarIcon: {width: 16, height: 16, marginRight: 4},
    scrollView: {
        flexGrow: 1,
    },
    loadingView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})