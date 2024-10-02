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
import HotIcon from "../assets/icons/hot.svg";
import {DoubanMovie} from "./tabs/DoubanMovie";
import {Bilibili} from "./tabs/Bilibili";

export const DEFAULT_CHANNEL_LIST = [
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
        enable: true,
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

const styles = StyleSheet.create({
    tabBarIcon: {
        marginRight: 4
    },
})

export const CHANNEL_COMPONENT_MAP = {
    'hot': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <HotIcon width={width} height={height} style={style}/>,
        component: (props) => <Sina {...props}/>,
    },
    'sina': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <WeiboIcon width={width} height={height} style={style}/>,
        component: (props) => <Sina {...props}/>,
    },
    'zhihu': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <ZhihuIcon width={width} height={height} style={style}/>,
        component: (props) => <Zhihu {...props}/>
    },
    'sspai': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <SspaiIcon width={width} height={height} style={style}/>,
        component: (props) => <Sspai {...props}/>
    },
    'xiaoyuzhou': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <XiaoyuzhouIcon width={width} height={height} style={style}/>,
        component: (props) => <Xiaoyuzhou {...props}/>
    },
    'stock': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <StockIcon width={width} height={height} style={style}/>,
        component: (props) => <></>
    },
    'doubanMovie': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <DoubanIcon width={width} height={height} style={style}/>,
        component: (props) => <DoubanMovie {...props}/>
    },
    'bilibili': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <BilibiliIcon width={width} height={height} style={style}/>,
        component: (props) => <Bilibili {...props}/>
    },
    'nnGroup': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <NngroupIcon width={width} height={height} style={style}/>,
        component: (props) => <></>
    },
    'tiobe': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <TiobeIcon width={width} height={height} style={style}/>,
        component: (props) => <></>
    },
    'history': {
        renderIcon: (style = styles.tabBarIcon, width = 16, height = 16) => <HistoryIcon width={width} height={height} style={style}/>,
        component: (props) => <></>
    },
};