import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity, View
} from 'react-native';
import {ErrorScreen} from "../screens/ErrorScreen";
import {useTrackShowing} from "../hooks/TrackHooks";

export const TabView = ({channelList, tabIndex, setTabIndex, onRefresh, loading, loadError, refreshing}) => {
    const [loadedTabs, setLoadedTabs] = useState(new Set());
    const playBarShowing = useTrackShowing();
    const tabViewRef = useRef(null);
    const screenWidth = Dimensions.get('window').width;
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        if (!dragging && tabViewRef.current) {
            tabViewRef.current.scrollTo({x: screenWidth * tabIndex, animated: true});
        }
    }, [tabIndex]);

    const changeTabIndex = (newIndex) => {
        const newLoadedTabs = new Set(loadedTabs);
        newLoadedTabs.add(tabIndex);
        setLoadedTabs(newLoadedTabs);
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
                                    <ScrollView
                                        key={index}
                                        contentContainerStyle={{flex: 1}}
                                        style={[styles.tabView, {paddingBottom: playBarShowing ? 100 : 0}]}
                                        refreshControl={
                                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                                        }
                                    >
                                        {
                                            loadError
                                                ? <ErrorScreen fetchNews={fetchNews}/>
                                                : (loading && !refreshing
                                                        ? <View style={styles.loadingView}>
                                                            <ActivityIndicator/>
                                                        </View>
                                                        : channel.component
                                                )
                                        }
                                    </ScrollView>
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
        marginBottom: 48,
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
