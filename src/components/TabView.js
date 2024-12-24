import React, {useContext, useEffect, useRef, useState, memo} from 'react';
import {ActivityIndicator, Dimensions, FlatList, StyleSheet, View} from 'react-native';
import {ErrorScreen} from "../screens/ErrorScreen";
import {NewsContext} from "../providers/NewsProvider";
import {Rss} from "../tabs/Rss";

const TabContent = memo(({ channel, rssLoadError, normalLoadError, rssLoading, normalLoading, rssRefreshing, normalRefreshing, fetchRssNews, fetchNormalNews }) => {
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

export const TabView = ({channelList, tabIndex, setTabIndex}) => {
    const context = useContext(NewsContext);
    const screenWidth = Dimensions.get('window').width;
    const [key, setKey] = useState(0);
    const flatListRef = useRef(null);
    const isManualScrolling = useRef(false);
    const isTabPress = useRef(false);
    
    useEffect(() => {
        setTabIndex(0);
        setKey(prevKey => prevKey + 1);
    }, [channelList]);

    useEffect(() => {
        if (!isManualScrolling.current && channelList.filter(channel => channel.enable).length > 0) {
            isTabPress.current = true;
            flatListRef.current?.scrollToIndex({
                index: tabIndex,
                animated: true
            });
            setTimeout(() => {
                isTabPress.current = false;
            }, 300);
        }
    }, [tabIndex]);

    const renderItem = ({ item: channel, index }) => (
        <View style={[styles.tabView, { width: screenWidth }]}>
            <TabContent 
                channel={channel}
                {...context}
            />
        </View>
    );

    const onMomentumScrollBegin = () => {
        isManualScrolling.current = true;
    };

    const onMomentumScrollEnd = () => {
        isManualScrolling.current = false;
    };

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0 && !isTabPress.current) {
            setTabIndex(viewableItems[0].index);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50
    }).current;

    return (
        <FlatList
            ref={flatListRef}
            key={key}
            data={channelList.filter(channel => channel.enable)}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={tabIndex}
            getItemLayout={(data, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
            })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            windowSize={3}
            maxToRenderPerBatch={1}
            removeClippedSubviews={true}
            onMomentumScrollBegin={onMomentumScrollBegin}
            onMomentumScrollEnd={onMomentumScrollEnd}
        />
    );
};

const styles = StyleSheet.create({
    tabView: {
        flex: 1,
    },
    tabBarIcon: {width: 16, height: 16, marginRight: 4},
    loadingView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    }
});
