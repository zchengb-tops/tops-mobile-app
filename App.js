import {SafeAreaView, StyleSheet, Text} from 'react-native';
import React, {useEffect, useState} from "react";
import {Tab, TabView} from "@rneui/themed";
import WeiboIcon from "./assets/icons/weibo.svg";
import ZhihuIcon from "./assets/icons/zhihu.svg";
import SspaiIcon from "./assets/icons/sspai.svg";
import BilibiliIcon from "./assets/icons/bilibili.svg";

export default function App() {
    const [index, setIndex] = React.useState(0);
    const [news, setNews] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://zchengb.top/api/normal-news');
            const data = await response.json();
            setNews(data);
            console.log('get news :)')
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Tab
                value={index}
                onChange={(e) => setIndex(e)}
                style={styles.tabBar}
                containerStyle={styles.tarBarContainer}
                indicatorStyle={styles.tabBarIndicator}
                scrollable
            >
                <Tab.Item
                    iconPosition="left"
                    title="微博"
                    titleStyle={styles.tabBarText}
                    icon={<WeiboIcon width={20} height={20} style={styles.tabBarIcon}/>}
                />
                <Tab.Item
                    iconPosition="left"
                    title="知乎"
                    titleStyle={styles.tabBarText}
                    icon={<ZhihuIcon width={20} height={20} style={styles.tabBarIcon}/>}
                />
                <Tab.Item
                    iconPosition="left"
                    title="少数派"
                    titleStyle={styles.tabBarText}
                    icon={<SspaiIcon width={20} height={20} style={styles.tabBarIcon}/>}
                />
                <Tab.Item
                    iconPosition="left"
                    title="哔哩哔哩"
                    titleStyle={styles.tabBarText}
                    icon={<BilibiliIcon width={20} height={20} style={styles.tabBarIcon}/>}
                />
                <Tab.Item
                    iconPosition="left"
                    title="哔哩哔哩"
                    titleStyle={styles.tabBarText}
                    icon={<BilibiliIcon width={20} height={20} style={styles.tabBarIcon}/>}
                />
                <Tab.Item
                    iconPosition="left"
                    title="哔哩哔哩"
                    titleStyle={styles.tabBarText}
                    icon={<BilibiliIcon width={20} height={20} style={styles.tabBarIcon}/>}
                />
                <Tab.Item
                    iconPosition="left"
                    title="哔哩哔哩"
                    titleStyle={styles.tabBarText}
                    icon={<BilibiliIcon width={20} height={20} style={styles.tabBarIcon}/>}
                />
            </Tab>

            <TabView value={index} onChange={setIndex} animationType="spring" loading={loading}>
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>RecentRecentRecentRecentRecent</Text>
                </TabView.Item>
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>Favorite</Text>
                </TabView.Item>
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>Cart</Text>
                </TabView.Item>
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>Cart</Text>
                </TabView.Item>
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>Cart</Text>
                </TabView.Item>
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>Cart</Text>
                </TabView.Item>
                <TabView.Item style={styles.tabView}>
                    <Text style={styles.text}>Cart</Text>
                </TabView.Item>
            </TabView>
        </SafeAreaView>
    );
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
        marginLeft: -12,
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
    }
});
