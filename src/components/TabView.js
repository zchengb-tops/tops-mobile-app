import React, {memo, useEffect, useRef} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {ErrorScreen} from "../screens/ErrorScreen";
import {Rss} from "../tabs/Rss";
import PagerView from 'react-native-pager-view';
import useNewsStore from '../stores/useNewsStore';

const TabContent = memo(({ channel }) => {
    const rssLoadError = useNewsStore(state => state.rssLoadError);
    const normalLoadError = useNewsStore(state => state.normalLoadError);
    const rssLoading = useNewsStore(state => state.rssLoading);
    const normalLoading = useNewsStore(state => state.normalLoading);
    const rssRefreshing = useNewsStore(state => state.rssRefreshing);
    const normalRefreshing = useNewsStore(state => state.normalRefreshing);
    const fetchRssNews = useNewsStore(state => state.fetchRssNews);
    const fetchNormalNews = useNewsStore(state => state.fetchNormalNews);

    if (channel.isRss) {
        if (rssLoadError) {
            return <ErrorScreen retry={fetchRssNews}/>;
        }
        return rssLoading && !rssRefreshing ? (
            <View style={styles.loadingView}>
                <ActivityIndicator/>
            </View>
        ) : channel.component;
    }
    
    if (normalLoadError) {
        return <ErrorScreen retry={fetchNormalNews}/>;
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

    if (!enabledChannels?.length) {
        return (
            <View style={styles.loadingView}>
                <ActivityIndicator/>
            </View>
        );
    }

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
