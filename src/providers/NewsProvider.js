import React, {createContext, useState} from 'react';
import {storage} from '../storage';
import * as Burnt from "burnt";

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

    const fetchRssNews = async () => {
        setRssLoadError(false);
        setRssLoading(true);
        try {
            const channelList = JSON.parse(storage.getString('channelList') || '[]');
            const rssChannels = channelList.filter(channel => channel.isRss && channel.enable);

            if (rssChannels.length > 0) {
                const rssUrls = rssChannels.map(channel => channel.rssUrl);
                const rssResponse = await fetch(apiUrl + '/rss-news', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({rssUrls})
                });
                const originRssData = await rssResponse.json();
                const rssNews = originRssData.reduce((news, item) => {
                    news[item.rssUrl] = item
                    return news
                  }, {});
                setRssNews(rssNews);
            }
        } catch (error) {
            console.error('Error fetching RSS news:', error);
            setRssLoadError(true);
        } finally {
            setRssLoading(false);
        }
    };

    const fetchNormalNews = async () => {
        setNormalLoadError(false);
        setNormalLoading(true);
        try {
            console.log('expo API URL:', apiUrl);
            const response = await fetch(apiUrl + '/normal-news');
            const data = await response.json();
            setNormalNews(data);
            await fetchRssNews();
        } catch (error) {
            console.error('Error fetching normal news:', error);
            setNormalLoadError(true);
        } finally {
            setNormalLoading(false);

        }
    };

    const refreshNews = async () => {
        setNormalRefreshing(true);
        await fetchNormalNews();
        setNormalRefreshing(false);
        console.log('refresh normal news completed.');
    }

    const refreshRssNews = async () => {
        setRssRefreshing(true);
        await fetchRssNews();
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