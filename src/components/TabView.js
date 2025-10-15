import React, {useEffect, useRef} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {ErrorScreen} from "../screens/ErrorScreen";
import PagerView from 'react-native-pager-view';
import useNewsStore from '../stores/useNewsStore';
import {useTab} from "../hooks/TabHooks";
import {Rss} from "../tabs/Rss";

const TabContent = ({channel}) => {
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
        ) : <Rss key={channel.rssUrl} rssUrl={channel.rssUrl}/>;
    }

    if (normalLoadError || !channel.component) {
        return <ErrorScreen retry={normalLoadError ? fetchNormalNews : undefined}
                            message={normalLoadError ? '' : '暂不支持该资讯频道，请等待后续版本升级 :)'}/>;
    }
    return normalLoading && !normalRefreshing ? (
        <View style={styles.loadingView}>
            <ActivityIndicator/>
        </View>
    ) : channel.component;
};

export const TabView = ({channelList}) => {
    const pagerRef = useRef(null);
    const { tabIndex, setTabIndex, triggerByTabBar } = useTab();

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
                if (e.nativeEvent.position !== tabIndex) {
                    setTabIndex(e.nativeEvent.position);
                }
            }}
            pageMargin={10}
            offscreenPageLimit={2}
        >
            {enabledChannels.map((channel, index) => {
                const uniqueKey = channel.isRss ? `${channel.id}-${channel.rssUrl}` : channel.id;
                return (
                    <View key={uniqueKey} style={styles.tabView}>
                        <TabContent channel={channel}/>
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
