import React, {createContext, useState} from 'react';
import {storage} from '../storage';
import * as Burnt from "burnt";
import {getNormalNews, getRssNews} from "../apis/News";

export const NewsContext = createContext();

export const NewsProvider = ({children}) => {
    const [normalNews, setNormalNews] = useState({"sina": [], "zhihu": [], 'sspai': []});
    const [rssNews, setRssNews] = useState([]);
    const [normalLoading, setNormalLoading] = useState(false);
    const [rssLoading, setRssLoading] = useState(false);
    const [normalLoadError, setNormalLoadError] = useState(false);
    const [rssLoadError, setRssLoadError] = useState(false);
    const [normalRefreshing, setNormalRefreshing] = useState(false);
    const [rssRefreshing, setRssRefreshing] = useState(false);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    const fetchRssNews = async (isRefreshing = false) => {
        setRssLoadError(false);
        setRssLoading(true);
        try {
            const channelList = JSON.parse(storage.getString('channelList') || '[]');
            const rssChannels = channelList.filter(channel => channel.isRss && channel.enable);

            if (rssChannels.length > 0) {
                const rssUrls = rssChannels.map(channel => channel.rssUrl);
                const response = await getRssNews(rssUrls);
                const originRssData = await response.json();

                if (response.ok) {
                    const rssNews = originRssData.reduce((news, item) => {
                        news[item.rssUrl] = item
                        return news
                    }, {});
                    setRssNews(rssNews);
                    if (isRefreshing) {
                        Burnt.toast({
                            title: '刷新成功',
                            preset: 'done',
                            duration: 1
                        });
                    }
                } else {
                    throw new Error(originRssData?.message || 'Failed to fetch rss news');
                }
            }
        } catch (error) {
            console.error('Error fetching RSS news:', error);
            setRssLoadError(true);
        } finally {
            setRssLoading(false);
        }
    };

    const fetchNormalNews = async (isRefreshing = false) => {
        setNormalLoadError(false);
        setNormalLoading(true);
        try {
            console.log('expo API URL:', apiUrl);
            const response = await getNormalNews();
            const data = await response.json();

            if (response.ok) {
                setNormalNews(data);
                if (isRefreshing) {
                    Burnt.toast({
                        title: '刷新成功',
                        preset: 'done',
                        duration: 1
                    });
                }
            } else {
                throw new Error(data?.message || 'Failed to fetch normal news');
            }
        } catch (error) {
            console.error('Error fetching normal news:', error);
            setNormalLoadError(true);
        } finally {
            setNormalLoading(false);
        }
    };

    const refreshNews = async () => {
        setNormalRefreshing(true);
        await fetchNormalNews(true);
        setNormalRefreshing(false);
        console.log('refresh normal news completed.');
    }

    const refreshRssNews = async () => {
        setRssRefreshing(true);
        await fetchRssNews(true);
        setRssRefreshing(false);
        console.log('refresh rss news completed.');
    }

    return (
        <NewsContext.Provider
            value={{
                normalNews,
                rssNews,
                fetchNormalNews,
                fetchRssNews,
                refreshNews,
                refreshRssNews,
                normalLoading,
                rssLoading,
                normalLoadError,
                rssLoadError,
                normalRefreshing,
                rssRefreshing
            }}>
            {children}
        </NewsContext.Provider>
    );
};