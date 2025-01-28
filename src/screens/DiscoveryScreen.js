import {useIsFocused} from "@react-navigation/native";
import {useTheme} from "@rneui/themed";
import React, {useEffect, useState} from "react";
import {AppState, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {logEvent} from "../analytics";
import {TabBar} from "../components/TabBar";
import {TabView} from "../components/TabView";
import {CHANNEL_COMPONENT_MAP} from "../constant";
import {storage} from "../storage";
import useNewsStore from '../stores/useNewsStore';
import {Rss} from "../tabs/Rss";
import {ErrorScreen} from "./ErrorScreen";


export const DiscoveryScreen = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [channelList, setChannelList] = useState([]);
    const isFocused = useIsFocused();
    const {theme} = useTheme();
    const [pagerKey, setPagerKey] = useState(0);
    const fetchNormalNews = useNewsStore(state => state.fetchNormalNews);
    const fetchRssNews = useNewsStore(state => state.fetchRssNews);
    const defaultChannelLoadError = useNewsStore(state => state.defaultChannelLoadError);
    const fetchDefaultChannels = useNewsStore(state => state.fetchDefaultChannels);
    const {top: topInset} = useSafeAreaInsets();

    useEffect(() => {
        let lastFetchTime = 0;
        const FIVE_MINUTES = 10 * 60 * 1000;

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
        initNews();
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

    const initNews = async () => {
        fetchNormalNews().then(() => console.log('Successfully fetch normal news :)'));
        fetchRssNews().then(() => console.log('Successfully fetch rss news :)'));
    }

    const alignChannelList = (currentChannelList, latestChannelList) => {
        let currentChannelMap = new Map(currentChannelList.map(item => [item.id, item]));
        let newChannelList = [...currentChannelList];

        latestChannelList.filter(channel => !channel.isRss)
            .forEach(channel => {
                const currentChannel = currentChannelMap.get(channel.id);
                if (currentChannel) {
                    const index = newChannelList.findIndex(item => item.id === channel.id);
                    newChannelList[index] = {
                        ...newChannelList[index],
                        title: channel.title,
                        tabTitle: channel.tabTitle,
                        desc: channel.desc
                    };
                } else {
                    newChannelList.push({...channel});
                }
            });

        const latestChannelMap = new Map(latestChannelList.map(item => [item.id, item]));

        newChannelList = newChannelList.filter(channel => 
            channel.isRss || latestChannelMap.get(channel.id)
        );

        return newChannelList;
    }

    const initialChannelList = async () => {
        const stringifyChannelList = storage.getString("channelList");
        let needUseDefaultChannelList = true;
        if (stringifyChannelList) {
            const parsedChannelList = JSON.parse(stringifyChannelList);

            if (parsedChannelList?.length > 0) {
                const defaultChannelList = await fetchDefaultChannels();
                const alignedChannelList = alignChannelList(parsedChannelList, defaultChannelList);

                const hasChanges = checkChannelListChanges(alignedChannelList, parsedChannelList);
                setChannelList(injectChannelComponentFields(alignedChannelList));
                needUseDefaultChannelList = false;

                if (hasChanges) {
                    storage.set("channelList", JSON.stringify(alignedChannelList));
                    setTabIndex(0);
                    setPagerKey(prevKey => prevKey + 1);
                }
            }
        }

        if (needUseDefaultChannelList) {
            fetchDefaultChannels().then(defaultChannelList => {
                storage.set("channelList", JSON.stringify(defaultChannelList));
                setChannelList(injectChannelComponentFields(defaultChannelList));
                setPagerKey(prevKey => prevKey + 1);
                setTabIndex(0);
            });
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

            const hasRssChannelChange = oldChannel.isRss && oldChannel.rssUrl !== newChannel.rssUrl;
            const hasDefaultChannelChange = !oldChannel.isRss && (
                oldChannel.tabTitle !== newChannel.tabTitle
                || oldChannel.title !== newChannel.title
                || oldChannel.desc !== newChannel.desc
            );

            console.log('newChannel', newChannel.title);
            console.log('hasRssChannelChange', hasRssChannelChange);
            console.log('hasDefaultChannelChange', hasDefaultChannelChange);
            if (hasRssChannelChange || hasDefaultChannelChange) {
                return true;
            }
        }

        return false;
    };

    const injectChannelComponentFields = (channelList) => {
        return channelList.map(channel => (
            {
                ...channel,
                renderIcon: CHANNEL_COMPONENT_MAP[channel?.channelCode || channel?.id]?.renderIcon,
                component: channel.isRss
                    ? <Rss rssUrl={channel.rssLink}/>
                    : CHANNEL_COMPONENT_MAP[channel?.channelCode || channel?.id]?.component
            }
        ));
    }

    const handlePageScrollStateChanged = (state) => {
        setIsScrolling(state === 'dragging' || state === 'settling');
    };

    return <View
        style={[
            styles.container,
            {
                backgroundColor: theme.colors.background,
                paddingTop: topInset
            }
        ]}
    >
        <TabBar channelList={channelList} tabIndex={tabIndex} setTabIndex={setTabIndex} isScrolling={isScrolling}/>
        {
            defaultChannelLoadError
                ? <ErrorScreen retry={() => {
                    initialChannelList();
                    initNews();
                }}/>
                : <TabView
                    key={pagerKey}
                    channelList={channelList}
                    tabIndex={tabIndex}
                    setTabIndex={setTabIndex}
                    onPageScrollStateChanged={handlePageScrollStateChanged}
                />
        }
    </View>
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})