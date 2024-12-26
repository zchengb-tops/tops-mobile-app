import React, {useContext, useRef, memo, useEffect} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {ErrorScreen} from "../screens/ErrorScreen";
import {NewsContext} from "../providers/NewsProvider";
import {Rss} from "../tabs/Rss";
import PagerView from 'react-native-pager-view';

const TabContent = memo(({ channel }) => {
    const {
        rssLoadError,
        normalLoadError,
        rssLoading,
        normalLoading,
        rssRefreshing,
        normalRefreshing,
        fetchRssNews,
        fetchNormalNews
    } = useContext(NewsContext);

    if (channel.isRss) {
        if (rssLoadError) {
            return <ErrorScreen fetchNews={fetchRssNews}/>;
        }
        return rssLoading && !rssRefreshing ? (
            <View style={styles.loadingView}>
                <ActivityIndicator/>
            </View>
        ) : <Rss rssUrl={channel.rssUrl}/>;
    }
    
    if (normalLoadError) {
        return <ErrorScreen fetchNews={fetchNormalNews}/>;
    }
    return normalLoading && !normalRefreshing ? (
        <View style={styles.loadingView}>
            <ActivityIndicator/>
        </View>
    ) : channel.component;
});

export const TabView = ({channelList, tabIndex, setTabIndex, onPageScrollStateChanged}) => {
    const pagerRef = useRef(null);
    
    useEffect(() => {
        if (pagerRef.current) {
            pagerRef.current.setPage(tabIndex);
        }
    }, [tabIndex]);

    const enabledChannels = channelList.filter(channel => channel.enable);

    return (
        <PagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={tabIndex}
            onPageSelected={(e) => {
                setTabIndex(e.nativeEvent.position);
            }}
            onPageScrollStateChanged={onPageScrollStateChanged}
            pageMargin={10}
            offscreenPageLimit={2}
        >
            {enabledChannels.map((channel, index) => {
                console.log('render tab view', channel.title, index);
                return (
                    <View key={index} style={styles.tabView}>
                        <TabContent channel={channel} />
                    </View>
                )
            })}
        </PagerView>
    );
};

const styles = StyleSheet.create({
    tabView: {
        flex: 1,
    },
    loadingView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    pagerView: {
        flex: 1,
    },
});
