import React, {createContext, useState} from 'react';
import {API_URL} from '@env';

export const NewsContext = createContext();

export const NewsProvider = ({children}) => {
    const [allNews, setAllNews] = useState({"sina": [], "zhihu": [], 'sspai': []});
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNews = async () => {
        setLoadError(false);
        setLoading(true);
        try {
            console.log('API URL:', API_URL);
            const response = await fetch(API_URL + '/normal-news');
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

    return (
        <NewsContext.Provider
            value={{allNews, fetchNews, refreshNews, loading, loadError, refreshing}}>
            {children}
        </NewsContext.Provider>
    );
};