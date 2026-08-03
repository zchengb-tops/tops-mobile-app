import WeiboIcon from "../assets/icons/weibo.svg";
import {Sina} from "./tabs/Sina";
import ZhihuIcon from "../assets/icons/zhihu.svg";
import {Zhihu} from "./tabs/Zhihu";
import SspaiIcon from "../assets/icons/sspai.svg";
import {Sspai} from "./tabs/Sspai";
import XiaoyuzhouIcon from "../assets/icons/xiaoyuzhou.svg";
import {Xiaoyuzhou} from "./tabs/Xiaoyuzhou";
import StockIcon from "../assets/icons/stock.svg";
import DoubanIcon from "../assets/icons/douban.svg";
import BilibiliIcon from "../assets/icons/bilibili.svg";
import NngroupIcon from "../assets/icons/nngroup.svg";
import TiobeIcon from "../assets/icons/tiobe.svg";
import HistoryIcon from "../assets/icons/history.svg";
import React from "react";
import {StyleSheet} from 'react-native';
import {DoubanMovie} from "./tabs/DoubanMovie";
import {Bilibili} from "./tabs/Bilibili";
import {Stock} from "./tabs/Stock";
import {NnGroup} from "./tabs/NnGroup";
import {Tiobe} from "./tabs/Tiobe";
import {History} from "./tabs/History";

export const DEFAULT_CHANNEL_LIST = [
    {
        id: 'sina',
        title: '新浪微博',
        tabTitle: '微博',
        desc: '新浪微博TOP50热搜榜',
        enable: true,
        isRss: false
    },
    {
        id: 'zhihu',
        title: '知乎',
        tabTitle: '知乎',
        desc: '知乎TOP50热榜',
        enable: true,
        isRss: false
    },
    {
        id: 'sspai',
        title: '少数派',
        tabTitle: '少数派',
        desc: '高效工作，品质生活',
        enable: true,
        isRss: false
    },
    {
        id: 'xiaoyuzhou',
        title: '小宇宙',
        tabTitle: '小宇宙FM',
        desc: '小宇宙FM每日榜单（最热榜、锋芒榜、新星榜）',
        enable: true,
        isRss: false
    },
    {
        id: 'stock',
        title: '沪深实时热力图',
        tabTitle: '实时沪深',
        desc: '汇集沪深股市各大板块热力图',
        enable: true,
        isRss: false
    },
    {
        id: 'doubanMovie',
        title: '豆瓣電影口碑榜',
        tabTitle: '豆瓣',
        desc: '每周最新的全球電影口碑排行榜',
        enable: true,
        isRss: false
    },
    {
        id: 'bilibili',
        title: '哔哩哔哩',
        tabTitle: '哔哩哔哩',
        desc: '哔哩哔哩每周必看榜单',
        enable: true,
        isRss: false
    },
    {
        id: 'nnGroup',
        title: 'Nielsen Norman Group',
        tabTitle: 'NN/g',
        desc: 'World Leaders in Research-Based User Experience',
        enable: true,
        isRss: false
    },
    {
        id: 'tiobe',
        title: 'TIOBE编程语言榜单',
        tabTitle: 'TIOBE',
        desc: '每月最新的全球编程语言排行榜',
        enable: true,
        isRss: false
    },
    {
        id: 'history',
        title: '历史上的今天',
        tabTitle: '历史薄',
        desc: '所以历史上的今天都发生了什么？',
        enable: true,
        isRss: false
    }
];

const styles = StyleSheet.create({
    tabBarIcon: {
        marginRight: 4
    },
})

export const CHANNEL_COMPONENT_MAP = {
    'sina': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <WeiboIcon width={width} height={height}
                                                                                       style={style}/>,
        component: <Sina/>,
    },
    'zhihu': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <ZhihuIcon width={width} height={height}
                                                                                       style={style}/>,
        component: <Zhihu/>
    },
    'sspai': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <SspaiIcon width={width} height={height}
                                                                                       style={style}/>,
        component: <Sspai/>
    },
    'xiaoyuzhou': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <XiaoyuzhouIcon width={width}
                                                                                            height={height}
                                                                                            style={style}/>,
        component: <Xiaoyuzhou/>
    },
    'stock': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <StockIcon width={width} height={height}
                                                                                       style={style}/>,
        component: <Stock/>
    },
    'doubanMovie': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <DoubanIcon width={width} height={height}
                                                                                        style={style}/>,
        component: <DoubanMovie/>
    },
    'bilibili': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <BilibiliIcon width={width} height={height}
                                                                                          style={style}/>,
        component: <Bilibili/>
    },
    'nnGroup': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <NngroupIcon width={width} height={height}
                                                                                         style={style}/>,
        component: <NnGroup/>
    },
    'tiobe': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <TiobeIcon width={width} height={height}
                                                                                       style={style}/>,
        component: <Tiobe/>
    },
    'history': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <HistoryIcon width={width} height={height}
                                                                                         style={style}/>,
        component: <History/>
    },
};

export const getChannelComponent = (channel) =>
    CHANNEL_COMPONENT_MAP[channel?.channelCode || channel?.id];

export const isAppSupportedChannel = (channel) =>
    Boolean(channel?.isRss) || Boolean(getChannelComponent(channel));

const CHANNEL_ICON_FALLBACK = {
    arena: 'https://infohub.net.cn/oss/channel-icon/arena.svg?v=20260803',
};

export const resolveChannelIconUrl = (channel) =>
    channel?.iconUrl || CHANNEL_ICON_FALLBACK[channel?.channelCode || channel?.id] || null;

export const sanitizeChannelsForApp = (channelList = []) =>
    channelList.map((channel) => {
        const withIcon = {
            ...channel,
            iconUrl: resolveChannelIconUrl(channel),
        };
        return isAppSupportedChannel(withIcon) ? withIcon : {...withIcon, enable: false};
    });

export const DEFAULT_AVATAR = "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/avatar/avatar4.png";