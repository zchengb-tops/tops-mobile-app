import {useIsFocused} from "@react-navigation/native";
import {useTheme} from "@rneui/themed";
import React, {useEffect, useState} from "react";
import {AppState, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {logEvent} from "../analytics";
import {TabBar} from "../components/TabBar";
import {TabView} from "../components/TabView";
import {CHANNEL_COMPONENT_MAP, DEFAULT_CHANNEL_LIST} from "../constant";
import {storage} from "../storage";
import useNewsStore from '../stores/useNewsStore';

export const DiscoveryScreen = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [channelList, setChannelList] = useState([]);
    const isFocused = useIsFocused();
    const {theme} = useTheme();
    const [pagerKey, setPagerKey] = useState(0);
    const fetchNormalNews = useNewsStore(state => state.fetchNormalNews);
    const fetchRssNews = useNewsStore(state => state.fetchRssNews);

    useEffect(() => {
        let lastFetchTime = 0;
        const FIVE_MINUTES = 5 * 60 * 1000;

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                const now = Date.now();
                if (now - lastFetchTime >= FIVE_MINUTES) {
                    lastFetchTime = now;
                    fetchNormalNews().then(() => console.log('Successfully fetch normal news after app active :)'));
                    fetchRssNews().then(() => console.log('Successfully fetch rss news after app active :)'));
                } else {
                    console.log('Skipping fetch - less than 2 minutes since last fetch');
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (isFocused) {
            initialChannelList();
        }
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
                    setPagerKey(prevKey => prevKey + 1);
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
        const enabledNewChannels = newList.filter(channel => channel.enable);
        const enabledOldChannels = oldList.filter(channel => channel.enable);

        if (enabledNewChannels.length !== enabledOldChannels.length) {
            return true;
        }

        for (let i = 0; i < enabledNewChannels.length; i++) {
            const newChannel = enabledNewChannels[i];
            const oldChannel = enabledOldChannels.find(channel => channel.id === newChannel.id);
            
            if (!oldChannel) {
                return true;
            }

            if (oldChannel.isRss && oldChannel.rssUrl !== newChannel.rssUrl) {
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

    const handlePageScrollStateChanged = (state) => {
        setIsScrolling(state === 'dragging' || state === 'settling');
    };

    return <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]} edges={['top']}>
        <TabBar channelList={channelList} tabIndex={tabIndex} setTabIndex={setTabIndex} isScrolling={isScrolling}/>
        <TabView 
            key={pagerKey}
            channelList={channelList} 
            tabIndex={tabIndex} 
            setTabIndex={setTabIndex} 
            onPageScrollStateChanged={handlePageScrollStateChanged}
        />
    </SafeAreaView>
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})