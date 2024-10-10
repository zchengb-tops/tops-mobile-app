import React, {useContext, useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity} from 'react-native';
import {NewsContext} from "../../utils/NewsProvider";

export const TabBar = () => {
    const {tabIndex, setTabIndex, channelList} = useContext(NewsContext);
    const tabWidths = useRef([]);
    const animatedPosition = useRef(new Animated.Value(0)).current;
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);
    const screenWidth = Dimensions.get('window').width;
    const [scrollX, setScrollX] = useState(0);
    const statusBarHeight = StatusBar.currentHeight || 0;
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (tabWidths.current.length > 0) {
            scrollToTab(tabIndex);
        }
    }, [tabIndex, channelList]);

    useEffect(() => {
        console.log('render tab bar')
    }, []);

    const scrollToTab = (index) => {
        if (scrollViewRef.current && tabWidths.current[index] !== undefined) {
            const tabItemEndPosition = tabWidths.current.slice(0, index + 1).reduce((total, width) => total + width, 10 * (index + 1));
            const tabItemStartPosition = tabItemEndPosition - 10 - tabWidths.current[index];

            const currentScreenEndPosition = scrollX + screenWidth;
            const currentScreenStartPosition = currentScreenEndPosition - screenWidth;

            setIsAnimating(true);

            if (currentScreenEndPosition < tabItemEndPosition) {
                let tabOffset = tabItemEndPosition - screenWidth + 10 + 20;
                tabOffset = tabOffset > 0 ? tabOffset : 0;
                scrollViewRef.current.scrollTo({
                    x: tabOffset,
                    animated: true,
                });
            } else if (tabItemStartPosition < currentScreenStartPosition) {
                scrollViewRef.current.scrollTo({
                    x: scrollX - (currentScreenStartPosition - tabItemStartPosition),
                    animated: true,
                });
            }
            Animated.spring(animatedPosition, {
                toValue: tabItemStartPosition,
                useNativeDriver: false,
            }).start();

            setTimeout(() => setIsAnimating(false), 300);

            setTimeout(() => {
                Animated.timing(animatedWidth, {
                    toValue: (tabWidths.current[tabIndex] || tabWidths.current[0]),
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            }, 100);
        }
    };

    const animatedStyle = {
        transform: [{
            translateX: animatedPosition
        }],
        width: animatedWidth,
    };

    const onScroll = (event) => {
        const {contentOffset} = event.nativeEvent;
        setScrollX(contentOffset.x);
    };

    return (
        <ScrollView
            style={[styles.tabBar, {marginTop: statusBarHeight}]}
            ref={scrollViewRef}
            contentContainerStyle={[styles.tabBarContent, {flexDirection: 'row'}]}
            horizontal={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
            alwaysBounceVertical={false}
        >
            <Animated.View style={[styles.selectedIndicator, animatedStyle]}/>
            {
                channelList
                    .filter(channel => channel.enable)
                    .map((channel, index) => {
                        return (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.tabBarItem]}
                                key={index}
                                disabled={isAnimating}
                                onPress={() => setTabIndex(index)}
                                onLayout={(event) => {
                                    const width = event.nativeEvent.layout.width;
                                    if (index === 0) {
                                        animatedWidth.setValue(width);
                                    }

                                    tabWidths.current[index] = width;
                                }}
                            >
                                {channel.renderIcon()}
                                <Animated.Text
                                    style={{
                                        ...styles.tabBarText,
                                        fontWeight: tabIndex === index ? '500' : 'normal'
                                    }}
                                >
                                    {channel.tabTitle}
                                </Animated.Text>
                            </TouchableOpacity>
                        )
                    })
            }
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        position: 'relative',
        maxHeight: 48,
        minHeight: 48,
        paddingVertical: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
        // backgroundColor: 'pink'
    },
    tabBarContent: {
        alignItems: 'center',
        height: 48,
        paddingHorizontal: 5,
    },
    tabBarText: {
        fontSize: 14,
        fontWeight: "normal",
        lineHeight: Platform.select({
            android: 20
        }),
        color: '#464646',
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    tabBarItem: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
        marginRight: 5,
    },
    selectedIndicator: {
        position: 'absolute',
        height: 2,
        backgroundColor: '#404040',
        left: 10,
        bottom: 0,
        zIndex: 0,
    }
});
