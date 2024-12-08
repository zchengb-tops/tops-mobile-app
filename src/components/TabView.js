import React, {useContext, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Dimensions, ScrollView, StyleSheet, View} from 'react-native';
import {ErrorScreen} from "../screens/ErrorScreen";
import {NewsContext} from "../providers/NewsProvider";
import {Rss} from "../tabs/Rss";

export const TabView = ({channelList, tabIndex, setTabIndex}) => {
    const {
        normalRefreshing,
        rssRefreshing,
        normalLoading,
        rssLoading,
        normalLoadError,
        rssLoadError,
        fetchNormalNews,
        fetchRssNews
    } = useContext(NewsContext);
    const [loadedTabs, setLoadedTabs] = useState(new Set());
    const tabViewRef = useRef(null);
    const screenWidth = Dimensions.get('window').width;
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        if (!dragging && tabViewRef.current) {
            saveLoadedTab();
            tabViewRef.current.scrollTo({x: screenWidth * tabIndex, animated: true});
        }
    }, [tabIndex, channelList]);

    useEffect(() => {
        console.log('render tabview');
    }, []);

    const saveLoadedTab = () => {
        const visibleChannelSize = channelList.filter(channel => channel.enable)?.length || 0;
        const newLoadedTabs = new Set(loadedTabs);
        newLoadedTabs.add(tabIndex);
        if (tabIndex + 1 < visibleChannelSize) {
            newLoadedTabs.add(tabIndex + 1);
        }
        setLoadedTabs(newLoadedTabs);
    }

    const changeTabIndex = (newIndex) => {
        saveLoadedTab();
        setTabIndex(newIndex);
    }

    const handleScroll = (event) => {
        if (!dragging) {
            return;
        }
        const xOffset = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(xOffset / screenWidth);

        if (newIndex !== tabIndex) {
            changeTabIndex(newIndex);
        }
    };

    return (
        <ScrollView
            ref={tabViewRef}
            horizontal
            pagingEnabled={true}
            onScroll={handleScroll}
            onScrollBeginDrag={() => setDragging(true)}
            onScrollEndDrag={() => setTimeout(() => setDragging(false), 100)}
            scrollEventThrottle={16}
            contentContainerStyle={{width: screenWidth * channelList.filter(channel => channel.enable).length}}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
        >
            {
                channelList
                    .filter(channel => channel.enable)
                    .map(
                        (channel, index) => {
                            if (loadedTabs.has(index) || Math.abs(tabIndex - index) <= 1) {
                                return (
                                    <View
                                        key={index}
                                        style={[styles.tabView]}
                                    >
                                        {
                                            channel.isRss ? (
                                                rssLoadError
                                                    ? <ErrorScreen fetchNews={fetchRssNews}/>
                                                    : (rssLoading && !rssRefreshing
                                                            ? <View style={styles.loadingView}>
                                                                <ActivityIndicator/>
                                                            </View>
                                                            : <Rss rssUrl={channel.rssUrl}/>
                                                    )
                                            ) : (
                                                normalLoadError
                                                    ? <ErrorScreen fetchNews={fetchNormalNews}/>
                                                    : (normalLoading && !normalRefreshing
                                                            ? <View style={styles.loadingView}>
                                                                <ActivityIndicator/>
                                                            </View>
                                                            : channel.component
                                                    )
                                            )
                                        }
                                    </View>
                                );
                            } else {
                                return <ScrollView key={index} style={styles.tabView}/>;
                            }
                        }
                    )
            }
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    tabView: {
        flex: 1,
        backgroundColor: '#fffff',
    },
    tabBarIcon: {width: 16, height: 16, marginRight: 4},
    loadingView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    }
});
