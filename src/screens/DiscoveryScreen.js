import {useIsFocused} from "@react-navigation/native";
import {useTheme} from "@rneui/themed";
import React, {useEffect, useState} from "react";
import {AppState, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {logEvent} from "../analytics";
import {TabBar} from "../components/TabBar";
import {TabView} from "../components/TabView";
import {getChannelComponent, sanitizeChannelsForApp} from "../constant";
import {storage} from "../storage";
import useNewsStore from '../stores/useNewsStore';
import {Rss} from "../tabs/Rss";
import {ErrorScreen} from "./ErrorScreen";
import {getUserNewsChannelConfig, getUserNewsChannelConfigCurrentVersion} from "../apis/User";
import {useTab} from "../hooks/TabHooks";

export const DiscoveryScreen = () => {
    const { tabIndex, setTabIndex } = useTab();
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
        if (!isFocused || !channelList?.length) {
            return;
        }
        const enabledChannels = channelList.filter((channel) => channel.enable);
        const activeChannel = enabledChannels[tabIndex];
        if (!activeChannel) {
            return;
        }
        const timer = setTimeout(() => {
            logEvent('screen_view', {
                screen_name: 'DiscoveryScreen',
                page_title: activeChannel.tabTitle || 'unknown',
            }).catch(error => {
                console.error('record screen view event failed:', error);
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [isFocused, tabIndex, channelList]);

    const resolveTabIndex = (nextChannelList, previousChannelList, currentTabIndex) => {
        const nextEnabled = nextChannelList.filter((channel) => channel.enable);
        if (!nextEnabled.length) {
            return 0;
        }
        const previousEnabled = previousChannelList.filter((channel) => channel.enable);
        const currentChannel = previousEnabled[currentTabIndex];
        if (!currentChannel) {
            return Math.min(currentTabIndex, nextEnabled.length - 1);
        }
        const matchedIndex = nextEnabled.findIndex((channel) => channel.id === currentChannel.id);
        return matchedIndex >= 0 ? matchedIndex : 0;
    };

    const initNews = async () => {
        fetchNormalNews().then(() => console.log('Successfully fetch normal news :)'));
        fetchRssNews().then(() => console.log('Successfully fetch rss news :)'));
    }

    const alignChannelList = (currentChannelList, latestChannelList) => {
        let currentChannelMap = new Map(currentChannelList.map(item => [item.id, item]));
        let newChannelList = [...currentChannelList];
        const latestChannelMap = new Map(latestChannelList.map(item => [item.id, item]));

        latestChannelList.filter(channel => !channel.isRss)
            .forEach(channel => {
                const currentChannel = currentChannelMap.get(channel.id);
                if (currentChannel) {
                    const index = newChannelList.findIndex(item => item.id === channel.id);
                    newChannelList[index] = {
                        ...newChannelList[index],
                        title: channel.title,
                        tabTitle: channel.tabTitle,
                        desc: channel.desc,
                        iconUrl: channel.iconUrl || newChannelList[index].iconUrl,
                    };
                } else {
                    newChannelList.push({...channel});
                }
            });

        newChannelList = newChannelList.map(channel => {
            if (channel.isRss) {
                return channel;
            }
            
            const latestChannel = latestChannelMap.get(channel.id);
            if (!latestChannel) {
                return {
                    ...channel,
                    enable: false
                };
            }
            
            return channel;
        });

        return newChannelList;
    }

    const isSyncEnabled = () => {
        return storage.getBoolean('isSyncEnabled') || false;
    }

    const syncChannelListFromServer = async () => {
        if (!storage.getString("accessToken") || !isSyncEnabled()) {
            return;
        }

        const localVersion = storage.getString("newsChannelConfigVersion");
        const response = await getUserNewsChannelConfigCurrentVersion();
        const {version: serverVersion} = await response.json();

        if (!localVersion || (serverVersion && localVersion < serverVersion)) {
            const oldChannelList = JSON.parse(storage.getString("channelList") || '[]');
            const {data: {version, content}} = await getUserNewsChannelConfig();
            const newChannelList = JSON.parse(content);
            const baselineChannelList = channelList.length > 0 ? channelList : oldChannelList;
            const nextTabIndex = resolveTabIndex(newChannelList, baselineChannelList, tabIndex);
            
            storage.set("channelList", JSON.stringify(newChannelList));
            storage.set("newsChannelConfigVersion", version);
            setChannelList(injectChannelComponentFields(newChannelList));
            setTabIndex(nextTabIndex);
            setPagerKey((prevKey) => prevKey + 1);
            
            const hasRssChannelChanges = checkRssChannelChanges(newChannelList, oldChannelList);
            if (hasRssChannelChanges) {
                console.log('🔄 RSS channels changed after server sync, fetching RSS news');
                fetchRssNews().then(() => console.log('Successfully fetch rss news after server sync :)'));
            }
        }
    }

    const initialChannelList = async () => {
        await syncChannelListFromServer();
        const stringifyChannelList = storage.getString("channelList");
        let needUseDefaultChannelList = true;
        if (stringifyChannelList) {
            const parsedChannelList = JSON.parse(stringifyChannelList);

            if (parsedChannelList?.length > 0) {
                const defaultChannelList = await fetchDefaultChannels();
                const alignedChannelList = alignChannelList(parsedChannelList, defaultChannelList);
                const nextChannelList = sanitizeChannelsForApp(alignedChannelList);
                const baselineChannelList = channelList.length > 0 ? channelList : sanitizeChannelsForApp(parsedChannelList);

                const hasChanges = checkChannelListChanges(nextChannelList, baselineChannelList);
                const hasOrderChanges = checkChannelOrderChanges(nextChannelList, baselineChannelList);
                
                console.log('🔍 Channel Check:', {
                    hasChanges,
                    hasOrderChanges,
                    currentOrder: baselineChannelList.filter(c => c.enable).map(c => c.id),
                    newOrder: nextChannelList.filter(c => c.enable).map(c => c.id)
                });

                if (!hasChanges && !hasOrderChanges && channelList.length > 0) {
                    needUseDefaultChannelList = false;
                    return;
                }

                const nextTabIndex = resolveTabIndex(nextChannelList, baselineChannelList, tabIndex);
                setChannelList(injectChannelComponentFields(alignedChannelList));
                needUseDefaultChannelList = false;

                if (hasChanges || hasOrderChanges) {
                    console.log('🔄 Incrementing pagerKey and restoring tab', nextTabIndex);
                    storage.set("channelList", JSON.stringify(alignedChannelList));
                    setTabIndex(nextTabIndex);
                    setPagerKey(prevKey => {
                        console.log('📄 PagerKey change:', prevKey, '->', prevKey + 1);
                        return prevKey + 1;
                    });
                    
                    const hasRssChannelChanges = checkRssChannelChanges(nextChannelList, baselineChannelList);
                    if (hasRssChannelChanges) {
                        console.log('🔄 RSS channels changed, fetching RSS news');
                        fetchRssNews().then(() => console.log('Successfully fetch rss news after channel sync :)'));
                    }
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

            if (hasRssChannelChange || hasDefaultChannelChange) {
                return true;
            }
        }

        return false;
    };

    const checkChannelOrderChanges = (newList, oldList) => {
        const enabledNewChannels = newList.filter(channel => channel.enable);
        const enabledOldChannels = oldList.filter(channel => channel.enable);

        if (enabledNewChannels.length !== enabledOldChannels.length) {
            return true;
        }

        for (let i = 0; i < enabledNewChannels.length; i++) {
            if (enabledNewChannels[i].id !== enabledOldChannels[i].id) {
                return true;
            }
        }

        return false;
    };

    const checkRssChannelChanges = (newList, oldList) => {
        const enabledNewRssChannels = newList.filter(channel => channel.enable && channel.isRss);
        const enabledOldRssChannels = oldList.filter(channel => channel.enable && channel.isRss);

        if (enabledNewRssChannels.length !== enabledOldRssChannels.length) {
            return true;
        }

        const oldRssUrlSet = new Set(enabledOldRssChannels.map(channel => channel.rssUrl));
        for (let i = 0; i < enabledNewRssChannels.length; i++) {
            if (!oldRssUrlSet.has(enabledNewRssChannels[i].rssUrl)) {
                return true;
            }
        }

        return false;
    };

    const injectChannelComponentFields = (channelList) => {
        return sanitizeChannelsForApp(channelList).map(channel => {
            const mapped = getChannelComponent(channel);
            return {
                ...channel,
                renderIcon: mapped?.renderIcon,
                component: channel.isRss ? null : mapped?.component
            };
        });
    }

    return <View
        style={[
            styles.container,
            {
                backgroundColor: theme.colors.background,
                paddingTop: topInset
            }
        ]}
    >
        <TabBar channelList={channelList}/>
        {
            defaultChannelLoadError
                ? <ErrorScreen retry={() => {
                    initialChannelList();
                    initNews();
                }}/>
                : <TabView
                    key={pagerKey}
                    channelList={channelList}
                />
        }
    </View>
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})