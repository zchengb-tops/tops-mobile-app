import React, {createContext, useState} from 'react';
import {storage} from "../src/storage";
import {CHANNEL_COMPONENT_MAP, DEFAULT_CHANNEL_LIST} from "../src/constant";

export const NewsContext = createContext();

export const NewsProvider = ({children}) => {
    const [tabIndex, setTabIndex] = useState(0);
    const [allNews, setAllNews] = useState({"sina": [], "zhihu": [], 'sspai': []});
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [channelList, setChannelList] = useState([]);

    const fetchNews = async () => {
        setLoadError(false);
        setLoading(true);
        try {
            const response = await fetch('https://zchengb.top/api/normal-news');
            const data = await response.json();
            setAllNews(data);
        } catch (error) {
            console.error('Error fetching news:', error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    const refreshNews = async () => {
        setRefreshing(true);
        await fetchNews();
        setRefreshing(false);
        console.log('refresh completed.');
    }

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

    return (
        <NewsContext.Provider
            value={{
                allNews,
                fetchNews,
                refreshNews,
                loading,
                loadError,
                refreshing,
                tabIndex,
                setTabIndex,
                initialChannelList,
                channelList
            }}>
            {children}
        </NewsContext.Provider>
    );
};