import React, {useContext, useEffect, useState} from "react";
import {RefreshControl, SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import {Tab, TabView} from "@rneui/themed";
import WeiboIcon from "../assets/icons/weibo.svg";
import ZhihuIcon from "../assets/icons/zhihu.svg";
import SspaiIcon from "../assets/icons/sspai.svg";
import BilibiliIcon from "../assets/icons/bilibili.svg";
import XiaoyuzhouIcon from "../assets/icons/xiaoyuzhou.svg";
import StockIcon from "../assets/icons/stock.svg";
import DoubanIcon from "../assets/icons/douban.svg";
import HistoryIcon from "../assets/icons/history.svg";
import NngroupIcon from "../assets/icons/nngroup.svg";
import TiobeIcon from "../assets/icons/tiobe.svg";
import {Sina} from "./tabs/Sina";
import {GlobalContext} from "../utils/GlobalContext";
import {Zhihu} from "./tabs/Zhihu";
import {Sspai} from "./tabs/Sspai";
import {Xiaoyuzhou} from "./tabs/Xiaoyuzhou";


export const NewsPageScreen = () => {
    const [tabIndex, setTabIndex] = useState(3);
    const {globalState, setGlobalState} = useContext(GlobalContext);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [channelList, setChannelList] = useState([
        {
            id: 'sina',
            title: '新浪微博',
            tabTitle: '微博',
            icon: <WeiboIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '新浪微博TOP50热搜榜',
            enable: true,
            component: <Sina/>
        },
        {
            id: 'zhihu',
            title: '知乎',
            tabTitle: '知乎',
            icon: <ZhihuIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '知乎TOP50热榜',
            enable: true,
            component: <Zhihu/>
        },
        {
            id: 'sspai',
            title: '少数派',
            tabTitle: '少数派',
            icon: <SspaiIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '高效工作，品质生活',
            enable: true,
            component: <Sspai/>
        },
        {
            id: 'xiaoyuzhou',
            title: '小宇宙',
            tabTitle: '小宇宙FM',
            icon: <XiaoyuzhouIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '小宇宙FM每日榜单（最热榜、锋芒榜、新星榜）',
            enable: true,
            component: <Xiaoyuzhou/>
        },
        {
            id: 'stock',
            title: '沪深实时热力图',
            tabTitle: '实时沪深',
            icon: <StockIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '汇集沪深股市各大板块热力图',
            enable: false,
            component: <></>
        },
        {
            id: 'doubanMovie',
            title: '豆瓣電影口碑榜',
            tabTitle: '豆瓣',
            icon: <DoubanIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '每周最新的全球電影口碑排行榜',
            enable: false,
            component: <></>
        },
        {
            id: 'bilibili',
            title: '哔哩哔哩',
            tabTitle: '哔哩哔哩',
            icon: <BilibiliIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '哔哩哔哩每周必看榜单',
            enable: false,
            component: <></>
        },
        {
            id: 'nnGroup',
            title: 'Nielsen Norman Group',
            tabTitle: 'NN/g',
            icon: <NngroupIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: 'World Leaders in Research-Based User Experience',
            enable: false,
            component: <></>
        },
        {
            id: 'tiobe',
            title: 'TIOBE编程语言榜单',
            tabTitle: 'TIOBE',
            icon: <TiobeIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '每月最新的全球编程语言排行榜',
            enable: false,
            component: <></>
        },
        {
            id: 'history',
            title: '历史上的今天',
            tabTitle: '历史薄',
            icon: <HistoryIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '所以历史上的今天都发生了什么？🧐',
            enable: false,
            component: <></>
        }
    ]);

    useEffect(() => {
        fetchNews().then(() => console.log('Successfully fetch news :)'));
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://zchengb.top/api/normal-news');
            const data = await response.json();
            setGlobalState({...globalState, news: data});
        } catch (error) {
            console.error('Error fetching news:', error);
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
        <Tab
            value={tabIndex}
            onChange={(e) => setTabIndex(e)}
            style={styles.tabBar}
            containerStyle={styles.tarBarContainer}
            indicatorStyle={styles.tabBarIndicator}
            scrollable
        >
            {
                channelList
                    .filter(channel => channel.enable)
                    .map((channel, index) =>
                        <Tab.Item
                            key={index}
                            iconPosition="left"
                            title={channel.tabTitle}
                            titleStyle={tabIndex === index ? styles.selectedTabBarText : styles.tabBarText}
                            icon={channel.icon}
                        />
                    )
            }
        </Tab>

        <TabView value={tabIndex} onChange={setTabIndex} animationType="spring" loading={loading} minSwipeRatio={0}
                 minSwipeSpeed={100}>
            {
                channelList
                    .filter(channel => channel.enable)
                    .map(
                        (channel, index) => {
                            return <TabView.Item style={styles.tabView} key={index}>
                                <ScrollView
                                    contentContainerStyle={styles.scrollView}
                                    refreshControl={
                                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                                    }
                                >
                                    {channel.component}
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
        paddingLeft: 4,
        paddingRight: 4
    },
    tabBar: {
        paddingLeft: 4,
        paddingRight: 4,
    },
    tarBarContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 48,
    },
    tabBarIndicator: {
        backgroundColor: '#626262',
        height: 3,
    },
    tabBarText: {
        marginLeft: -16,
        fontSize: 16,
        fontWeight: "normal",
        color: 'rgba(0,0,0,0.85)',
    },
    selectedTabBarText: {
        marginLeft: -16,
        fontSize: 16,
        fontWeight: "bold",
        color: 'rgba(0,0,0,0.85)',
    },
    tabBarIcon: {
        marginRight: 8,
    },
    text: {
        fontSize: 24,
        color: 'black',
        textAlign: 'center',
        marginTop: 20,
    },
    tabView: {
        backgroundColor: '#F8F8F8',
        width: '100%'
    },
    scrollView: {
        flexGrow: 1,
    },
})