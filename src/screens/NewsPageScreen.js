import React, {useContext, useEffect, useState} from "react";
import {ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, View} from 'react-native';
import {TabView} from "@rneui/themed";
import WeiboIcon from "../../assets/icons/weibo.svg";
import ZhihuIcon from "../../assets/icons/zhihu.svg";
import SspaiIcon from "../../assets/icons/sspai.svg";
import BilibiliIcon from "../../assets/icons/bilibili.svg";
import XiaoyuzhouIcon from "../../assets/icons/xiaoyuzhou.svg";
import StockIcon from "../../assets/icons/stock.svg";
import DoubanIcon from "../../assets/icons/douban.svg";
import HistoryIcon from "../../assets/icons/history.svg";
import NngroupIcon from "../../assets/icons/nngroup.svg";
import TiobeIcon from "../../assets/icons/tiobe.svg";
import {Sina} from "../tabs/Sina";
import {GlobalContext} from "../../utils/GlobalContext";
import {Zhihu} from "../tabs/Zhihu";
import {Sspai} from "../tabs/Sspai";
import {Xiaoyuzhou} from "../tabs/Xiaoyuzhou";
import {useTrackShowing} from "../hooks/TrackHooks";
import {TabBar} from "../components/TabBar";
import {ErrorScreen} from "./ErrorScreen";
import {storage} from "../storage";


const DEFAULT_CHANNEL_LIST = [
    {
        id: 'hot',
        title: '今日热门',
        tabTitle: '今日热门',
        desc: '今日热门事件',
        enable: true,
        isOrigin: true
    },
    {
        id: 'sina',
        title: '新浪微博',
        tabTitle: '微博',
        desc: '新浪微博TOP50热搜榜',
        enable: true,
        isOrigin: true
    },
    {
        id: 'zhihu',
        title: '知乎',
        tabTitle: '知乎',
        desc: '知乎TOP50热榜',
        enable: true,
        isOrigin: true
    },
    {
        id: 'sspai',
        title: '少数派',
        tabTitle: '少数派',
        desc: '高效工作，品质生活',
        enable: true,
        isOrigin: true
    },
    {
        id: 'xiaoyuzhou',
        title: '小宇宙',
        tabTitle: '小宇宙FM',
        desc: '小宇宙FM每日榜单（最热榜、锋芒榜、新星榜）',
        enable: true,
        isOrigin: true
    },
    {
        id: 'stock',
        title: '沪深实时热力图',
        tabTitle: '实时沪深',
        desc: '汇集沪深股市各大板块热力图',
        enable: false,
        isOrigin: true
    },
    {
        id: 'doubanMovie',
        title: '豆瓣電影口碑榜',
        tabTitle: '豆瓣',
        desc: '每周最新的全球電影口碑排行榜',
        enable: false,
        isOrigin: true
    },
    {
        id: 'bilibili',
        title: '哔哩哔哩',
        tabTitle: '哔哩哔哩',
        desc: '哔哩哔哩每周必看榜单',
        enable: false,
        isOrigin: true
    },
    {
        id: 'nnGroup',
        title: 'Nielsen Norman Group',
        tabTitle: 'NN/g',
        desc: 'World Leaders in Research-Based User Experience',
        enable: false,
        isOrigin: true
    },
    {
        id: 'tiobe',
        title: 'TIOBE编程语言榜单',
        tabTitle: 'TIOBE',
        desc: '每月最新的全球编程语言排行榜',
        enable: false,
        isOrigin: true
    },
    {
        id: 'history',
        title: '历史上的今天',
        tabTitle: '历史薄',
        desc: '所以历史上的今天都发生了什么？🧐',
        enable: false,
        isOrigin: true
    }
];

export const NewsPageScreen = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const {globalState, setGlobalState} = useContext(GlobalContext);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const playBarShowing = useTrackShowing();
    const [channelList, setChannelList] = useState([]);
    const channelComponentMap = {
        'hot': {
            icon: <WeiboIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <Sina/>,
        },
        'sina': {
            icon: <WeiboIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <Sina/>,
        },
        'zhihu': {
            icon: <ZhihuIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <Zhihu/>
        },
        'sspai': {
            icon: <SspaiIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <Sspai/>
        },
        'xiaoyuzhou': {
            icon: <XiaoyuzhouIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <Xiaoyuzhou/>
        },
        'stock': {
            icon: <StockIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <></>
        },
        'douban': {
            icon: <DoubanIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <></>
        },
        'bilibili': {
            icon: <BilibiliIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <></>
        },
        'nngroup': {
            icon: <NngroupIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <></>
        },
        'tiobe': {
            icon: <TiobeIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <></>
        },
        'history': {
            icon: <HistoryIcon width={16} height={16} style={styles.tabBarIcon}/>,
            component: <></>
        },
    };

    useEffect(() => {
        const stringifyChannelList = storage.getString("channelList");
        let needUseDefaultChannelList = true;
        if (stringifyChannelList) {
            const parsedChannelList = JSON.parse(stringifyChannelList);
            if (parsedChannelList?.length > 0) {
                setChannelList(injectChannelComponentFields(parsedChannelList));
                needUseDefaultChannelList = false;
            }
        }

        if (needUseDefaultChannelList) {
            const initialChannelList = DEFAULT_CHANNEL_LIST;
            storage.set("channelList", JSON.stringify(initialChannelList));
            setChannelList(injectChannelComponentFields(initialChannelList));
        }

        fetchNews().then(() => console.log('Successfully fetch news :)'));
    }, []);

    const injectChannelComponentFields = (channelList) => {
        return channelList.map(channel => (
            {
                ...channel,
                icon: channelComponentMap[channel.id]?.icon,
                component: channelComponentMap[channel.id]?.component
            }
        ));
    }

    const fetchNews = async () => {
        setLoadError(false);
        setLoading(true);
        try {
            const response = await fetch('https://zchengb.top/api/normal-news');
            const data = await response.json();
            setGlobalState({...globalState, news: data});
        } catch (error) {
            console.error('Error fetching news:', error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNews();
        setRefreshing(false);
        console.log('refresh completed.');
    };

    return <SafeAreaView style={styles.container}>
        <TabBar channelList={channelList} tabIndex={tabIndex} setTabIndex={setTabIndex}/>
        <TabView value={tabIndex} onChange={setTabIndex} animationType="spring" minSwipeRatio={0} minSwipeSpeed={100}>
            {
                channelList
                    .filter(channel => channel.enable)
                    .map(
                        (channel, index) => {
                            return <TabView.Item style={styles.tabView} key={index}>
                                <ScrollView
                                    contentContainerStyle={[styles.scrollView, {paddingBottom: playBarShowing ? 100 : 0}]}
                                    refreshControl={
                                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                                    }
                                >
                                    {
                                        loadError
                                            ?
                                            <ErrorScreen fetchNews={fetchNews}/>
                                            :
                                            (loading && !refreshing
                                                ?
                                                <View style={styles.loadingView}>
                                                    <ActivityIndicator/>
                                                </View>
                                                :
                                                channel.component)
                                    }
                                </ScrollView>
                            </TabView.Item>
                        }
                    )
            }
        </TabView>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tabBarIcon: {
        marginRight: 4
    },
    tabView: {
        flex: 1,
        backgroundColor: '#fffff',
        width: '100%'
    },
    scrollView: {
        flexGrow: 1,
    },
    loadingView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})