import {request} from "../request";

export const getRssNews = (rssUrls) => {
    return request('/rss-news', {
        method: 'POST',
        body: {rssUrls}
    });
};

export const getNormalNews = () => {
    return request('/normal-news', {
        method: 'GET'
    });
};

export const saveRssResource = (rssUrl, recommendationId) => {
    return request('/rss-resource', {
        method: 'POST',
        body: {rssUrl, ...(recommendationId ? {recommendationId} : {})}
    });
};

export const getRssResourceTitle = (rssUrl) => {
    return request('/rss-resource/title?rssUrl=' + rssUrl, {
        method: 'GET'
    });
};

export const getRssRecommendations = () => {
    return request('/rss-recommendations', {
        method: 'GET'
    });
};

export const getDefaultChannel = () => {
    return request('/news-channels/default', {
        method: 'GET'
    });
};
