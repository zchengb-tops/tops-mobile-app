import {create} from 'zustand'
import {getNormalNews, getRssNews, getDefaultChannel} from "../apis/News";
import {storage} from '../storage';

const useNewsStore = create((set, get) => ({
    defaultChannelList: [],
    normalNews: {"sina": [], "zhihu": [], 'sspai': [], 'tiobe': [], 'arena': []},
    rssNews: [],
    normalLoading: false,
    rssLoading: false,
    normalLoadError: false,
    rssLoadError: false,
    defaultChannelLoadError: false,
    normalRefreshing: false,
    rssRefreshing: false,

    fetchDefaultChannels: async () => {
        set({defaultChannelLoadError: false});
        try {
            if (get().defaultChannelList.length > 0) {
                return get().defaultChannelList;
            }

            const response = await getDefaultChannel();
            const data = await response.json();
            const channelList = data.filter(item => item.isAppEnabled)
                .map(item => ({
                    ...item,
                    title: item.name,
                    desc: item.description,
                    enable: item.isDefaultSubscribed
                }))
                .map(({
                          isAppEnabled,
                          isExtensionEnabled,
                          isDefaultSubscribed,
                          minExtensionVersion,
                          minAppVersion,
                          name,
                          description,
                          ...rest
                      }) => rest);
            set({defaultChannelList: channelList});
            return channelList;
        } catch (error) {
            set({defaultChannelLoadError: true});
            console.error('Error fetching default channels:', error);
        }
    },


    fetchRssNews: async (isRefreshing = false) => {
        set({rssLoadError: false, rssLoading: true});
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
                    set({rssNews});
                    console.log('fetch rss news completed.');
                } else {
                    throw new Error(originRssData?.message || 'Failed to fetch rss news');
                }
            }
        } catch (error) {
            console.error('Error fetching RSS news:', error);
            set({rssLoadError: true});
        } finally {
            set({rssLoading: false});
        }
    },

    fetchNormalNews: async (isRefreshing = false) => {
        set({normalLoadError: false, normalLoading: true});
        try {
            const response = await getNormalNews();
            const data = await response.json();

            if (response.ok) {
                set({normalNews: data});
                console.log('fetch normal news completed.');
            } else {
                throw new Error(data?.message || 'Failed to fetch normal news');
            }
        } catch (error) {
            console.error('Error fetching normal news:', error);
            set({normalLoadError: true});
        } finally {
            set({normalLoading: false});
        }
    },

    refreshNews: async () => {
        set({normalRefreshing: true});
        console.log('refresh normal news start.');
        await get().fetchNormalNews(true);
        set({normalRefreshing: false});
        console.log('refresh normal news completed.');
    },

    refreshRssNews: async () => {
        set({rssRefreshing: true});
        await get().fetchRssNews(true);
        set({rssRefreshing: false});
        console.log('refresh rss news completed.');
    },
}));

export default useNewsStore;