import React, {useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';

export const TabBar = React.memo(({state, descriptors, navigation, position}) => {
    const scrollViewRef = useRef(null);
    const tabWidths = useRef([]);
    const screenWidth = Dimensions.get('window').width;
    const [scrollX, setScrollX] = useState(0);

    const scrollToTab = (index) => {
        if (scrollViewRef.current && tabWidths.current[index] !== undefined) {
            const tabItemEndPosition = tabWidths.current.slice(0, index + 1).reduce((total, width) => total + width, 10 * (index + 1));
            const tabItemStartPosition = tabItemEndPosition - 10 - tabWidths.current[index];
            let tabOffset = tabItemEndPosition - screenWidth + 10;
            tabOffset = tabOffset > 0 ? tabOffset : 0;

            const currentScreenEndPosition = scrollX + screenWidth;
            const currentScreenStartPosition = currentScreenEndPosition - screenWidth;
            if (currentScreenEndPosition < tabItemEndPosition) {
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
        }
    };

    useEffect(() => {
        scrollToTab(state.index);
    }, [state])

    const onScroll = (event) => {
        const {contentOffset} = event.nativeEvent;
        setScrollX(contentOffset.x);
    };

    return <View style={styles.tabBar}>
        <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollToOverflowEnabled={true}
            contentContainerStyle={{flexGrow: 1, paddingHorizontal: 5}}
            scrollEventThrottle={16}
            onScroll={onScroll}
        >
            {state.routes.map((route, index) => {
                const {options} = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? {selected: true} : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        style={isFocused ? styles.selectedTabBarItem : styles.tabBarItem}
                        onLayout={(event) => {
                            tabWidths.current[index] = event.nativeEvent.layout.width;
                        }}
                    >
                        <Animated.Text style={isFocused ? styles.selectedTabBarText : styles.tabBarText}>
                            {label}
                        </Animated.Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    </View>;
}, (prevProps, nextProps) => {
    return prevProps.state.index === nextProps.state.index &&
        prevProps.descriptors === nextProps.descriptors &&
        prevProps.navigation === nextProps.navigation &&
        prevProps.position === nextProps.position;
});

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 0,
        paddingTop: 4,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    tabBarText: {
        fontSize: 14,
        fontWeight: "normal",
        color: '#464646',
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    selectedTabBarText: {
        fontSize: 14,
        color: '#FFFFFF',
        paddingHorizontal: 0,
        textAlign: 'center',
        alignItems: 'center',
        paddingVertical: 0,
    },
    tabBarItem: {
        borderRadius: 24,
        minHeight: 0,
        width: 'auto',
        backgroundColor: '#ECEDF0',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginLeft: 5,
        marginRight: 5
    },
    selectedTabBarItem: {
        borderRadius: 24,
        minHeight: 0,
        width: 'auto',
        backgroundColor: '#404040',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginLeft: 5,
        marginRight: 5
    },
});
