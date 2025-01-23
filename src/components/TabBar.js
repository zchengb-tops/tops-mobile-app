import React, {useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Text} from "./Text";
import {useTheme} from "@rneui/themed";
import {SvgUri} from "react-native-svg";

export const TabBar = ({channelList, tabIndex, setTabIndex, isScrolling}) => {
    const tabWidths = useRef([]);
    const animatedPosition = useRef(new Animated.Value(0)).current;
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);
    const screenWidth = Dimensions.get('window').width;
    const [scrollX, setScrollX] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const {theme} = useTheme();

    useEffect(() => {
        if (tabWidths.current.length > 0 && !isScrolling) {
            scrollToTab(tabIndex);
        }
    }, [tabIndex, channelList, isScrolling]);

    useEffect(() => {
        console.log('render tab bar')
    }, []);

    const scrollToTab = (index) => {
        if (scrollViewRef.current && tabWidths.current[index] !== undefined) {
            const tabItemEndPosition = tabWidths.current.slice(0, index + 1).reduce((total, width) => total + width, 10 * (index + 1));
            const tabItemStartPosition = tabItemEndPosition - 10 - tabWidths.current[index];

            Animated.parallel([
                Animated.spring(animatedPosition, {
                    toValue: tabItemStartPosition,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7
                }),
                Animated.spring(animatedWidth, {
                    toValue: tabWidths.current[index],
                    useNativeDriver: false,
                    tension: 50,
                    friction: 7
                })
            ]).start();

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
                useNativeDriver: true,
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
        }]
    };

    const onScroll = (event) => {
        const {contentOffset} = event.nativeEvent;
        setScrollX(contentOffset.x);
    };

    if (!channelList?.length) {
        return (
            <ScrollView
                style={[styles.tabBar, {
                    borderBottomColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                }]}
                horizontal
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                alwaysBounceVertical={false}
                contentContainerStyle={[styles.tabBarContent]}
            >
                {[1, 2, 3, 4].map((_, index) => (
                    <>
                        <View style={[styles.tabBarIcon, {
                            backgroundColor: '#F5F5F5',
                            borderRadius: 26,
                            width: 24,
                            height: 24,
                            marginLeft: 2,
                            marginRight: 2,
                        }]}/>
                        <View key={index} style={[styles.tabBarItem, {
                            backgroundColor: '#F5F5F5',
                            width: 72,
                            height: 28,
                            borderRadius: 8,
                            marginRight: 10,
                        }]} />
                    </>
                ))}
            </ScrollView>
        );
    }

    return (
        <ScrollView
            style={[styles.tabBar, {
                borderBottomColor: theme.colors.border,
                backgroundColor: theme.colors.background,
            }]}
            ref={scrollViewRef}
            contentContainerStyle={[styles.tabBarContent, {flexDirection: 'row'}]}
            horizontal={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
            alwaysBounceVertical={false}
        >
            <Animated.View style={[styles.selectedIndicator, animatedStyle, {backgroundColor: theme.colors.indicator}]}>
                <Animated.View style={{width: animatedWidth}}/>
            </Animated.View>

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
                                {
                                    channel.isRss
                                        ?
                                        (
                                            channel.iconUrl?.endsWith('.svg')
                                                ? <SvgUri width={16} height={16} uri={channel.iconUrl} style={styles.tabBarIcon}/>
                                                : <Image source={{uri: channel.iconUrl}} style={styles.tabBarIcon}/>
                                        )
                                        :
                                        channel.renderIcon()
                                }
                                <Text
                                    style={{
                                        ...styles.tabBarText,
                                        color: theme.colors.text,
                                        fontWeight: tabIndex === index ? '500' : 'normal'
                                    }}
                                >
                                    {channel.tabTitle}
                                </Text>
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
        left: 10,
        bottom: 0,
        zIndex: 0,
    },
    tabBarIcon: {
        width: 16,
        height: 16,
        marginRight: 4
    }
});
