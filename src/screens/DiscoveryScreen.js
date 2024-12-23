import {useIsFocused} from "@react-navigation/native";
import React, {useContext, useEffect, useState} from "react";
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {TabBar} from "../components/TabBar";
import {TabView} from "../components/TabView";
import {CHANNEL_COMPONENT_MAP, DEFAULT_CHANNEL_LIST} from "../constant";
import {NewsContext} from "../providers/NewsProvider";
import {storage} from "../storage";
import {useTheme} from "@rneui/themed";
import {logEvent} from "../analytics";

export const DiscoveryScreen = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const {fetchNormalNews, fetchRssNews} = useContext(NewsContext);
    const [channelList, setChannelList] = useState([]);
    const isFocused = useIsFocused();
    const {theme} = useTheme();

    useEffect(() => {
        initialChannelList();
    }, [isFocused]);

    useEffect(() => {
        fetchNormalNews().then(() => console.log('Successfully fetch normal news :)'));
        fetchRssNews().then(() => console.log('Successfully fetch rss news :)'));
    }, []);

    useEffect(() => {
        if (isFocused && channelList) {
            logEvent('screen_view', {
                screen_name: 'DiscoveryScreen',
                page_title: channelList[tabIndex]?.tabTitle || 'unknown',
            }).catch(error => {
                console.error('record screen view event failed:', error);
            });
        }
    }, [isFocused, tabIndex]);

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

    return <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]} edges={['top']}>
        <TabBar channelList={channelList} tabIndex={tabIndex} setTabIndex={setTabIndex}/>
        <TabView channelList={channelList} tabIndex={tabIndex} setTabIndex={setTabIndex}/>
    </SafeAreaView>
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})