import { request } from "../request";

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