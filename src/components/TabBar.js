import React, {useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity} from 'react-native';

export const TabBar = ({channelList, tabIndex, setTabIndex}) => {
    const tabWidths = useRef([]);
    const animatedTextColors = useRef([]);
    const animatedPosition = useRef(new Animated.Value(0)).current;
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);
    const screenWidth = Dimensions.get('window').width;
    const [scrollX, setScrollX] = useState(0);
    const statusBarHeight = StatusBar.currentHeight || 0;

    useEffect(() => {
        if (tabWidths.current.length > 0) {
            scrollToTab(tabIndex);
        }
    }, [tabIndex, channelList]);

    const scrollToTab = (index) => {
        if (scrollViewRef.current && tabWidths.current[index] !== undefined) {
            const tabItemEndPosition = tabWidths.current.slice(0, index + 1).reduce((total, width) => total + width, 10 * (index + 1));
            const tabItemStartPosition = tabItemEndPosition - 10 - tabWidths.current[index];

            const currentScreenEndPosition = scrollX + screenWidth;
            const currentScreenStartPosition = currentScreenEndPosition - screenWidth;
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

            setTimeout(() => {
                Animated.timing(animatedWidth, {
                    toValue: (tabWidths.current[tabIndex] || tabWidths.current[0]) + 20,
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            }, 100);

            Animated.timing(animatedTextColors.current[tabIndex], {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
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
            contentContainerStyle={styles.tabBarContent}
            horizontal
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
        >
            <Animated.View style={[styles.selectedBackground, animatedStyle]}/>
            {
                channelList
                    .filter(channel => channel.enable)
                    .map((channel, index) => {
                        const animatedTextColorValue = new Animated.Value(tabIndex === index ? 1 : 0);
                        const animatedTextColor = animatedTextColorValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['#464646', '#FFFFFF']
                        })
                        animatedTextColors.current[index] = animatedTextColorValue;

                        return (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={[styles.tabBarItem]}
                                key={index}
                                onPress={() => setTabIndex(index)}
                                onLayout={(event) => {
                                    const width = event.nativeEvent.layout.width;
                                    if (index === 0) {
                                        animatedWidth.setValue(width);
                                    }

                                    tabWidths.current[index] = index === tabIndex ? width - 20 : width;
                                }}
                            >
                                {
                                    tabIndex === index ? channel.renderIcon() : <></>
                                }
                                <Animated.Text
                                    style={{
                                        ...styles.tabBarText,
                                        color: animatedTextColor,
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
        maxHeight: 54,
        paddingVertical: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    tabBarContent: {
        alignItems: 'center',
        height: 54,
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
        marginRight: 5
    },
    selectedBackground: {
        position: 'absolute',
        height: 36,
        backgroundColor: '#404040',
        borderRadius: 24,
        left: 10,
        zIndex: 0,
    }
});
