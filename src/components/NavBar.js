import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVisibility } from "../providers/VisibilityProvider";
import { Icon, useTheme } from "@rneui/themed";
import { useNavigation } from "@react-navigation/native";
import { Text } from "./Text";
import { useDarkMode } from "../hooks/DarkModeHooks";


export const NavBar = () => {
    const routeMapping = {
        DISCOVERY: 'DiscoveryScreen',
        SUBSCRIBE: 'SubscribeScreen',
        PROFILE: 'ProfileScreen',
    }
    const navigation = useNavigation();
    const [currentRoute, setCurrentRoute] = useState(routeMapping.DISCOVERY);
    const translateAnim = useRef(new Animated.Value(0)).current;
    const positionAnim = useRef(new Animated.Value(100)).current;
    const tabRefs = useRef({});
    const { isNavBarVisible } = useVisibility();
    const { theme } = useTheme();
    const isDarkMode = useDarkMode();


    useEffect(() => {
        if (isNavBarVisible) {
            Animated.timing(positionAnim, {
                toValue: 0,
                duration: 200,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(positionAnim, {
                toValue: 100,
                duration: 100,
                easing: Easing.ease,
                useNativeDriver: true,
            }).start();
        }
    }, [isNavBarVisible]);

    const handleLayout = (screenName, layout) => {
        tabRefs.current[screenName] = layout;
    };

    const renderLabel = (screenName, label) => {
        return <Text style={[styles.navText, { color: theme.colors.text }, currentRoute === screenName && styles.selectedNavText]}>{label}</Text>;
    };

    const renderIcon = (screenName) => {
        const iconColor = isDarkMode ? '#FFFFFF' : '#949494';
        const selectedColor = isDarkMode ? '#FFFFFF' : '#f5f5f5';

        switch (screenName) {
            case routeMapping.DISCOVERY:
                return currentRoute === screenName
                    ?
                    <Icon
                        size={24}
                        name='navigate-circle-outline'
                        type='ionicon'
                        color={selectedColor}
                    />
                    :
                    <Icon
                        size={24}
                        name='navigate-circle-outline'
                        type='ionicon'
                        color={iconColor}
                    />;
            case routeMapping.PROFILE:
                return currentRoute === screenName
                    ?
                    <Icon
                        size={24}
                        name='person-circle-outline'
                        type='ionicon'
                        color={selectedColor}
                    />
                    :
                    <Icon
                        size={24}
                        name='person-circle-outline'
                        type='ionicon'
                        color={iconColor}
                    />;
            case routeMapping.SUBSCRIBE:
                return currentRoute === screenName
                    ?
                    <Icon
                        size={20}
                        name='logo-rss'
                        type='ionicon'
                        color={selectedColor}
                    />
                    :
                    <Icon
                        size={20}
                        name='logo-rss'
                        type='ionicon'
                        color={iconColor}
                    />;
        }
    }

    const goto = (routeName, index) => {
        const { x } = tabRefs.current[routeName];

        Animated.spring(translateAnim, {
            toValue: x - 16,
            useNativeDriver: true,
        }).start();

        setCurrentRoute(routeName);
        navigation.navigate(routeName);
    }

    if (!isNavBarVisible) {
        return null;
    }

    return (
        <SafeAreaView edges={['bottom']} style={{backgroundColor: isDarkMode ? '#000000' : '#F5F5F5',}}>
            <Animated.View
                style={[
                    styles.navBarWrapper,
                    {
                        transform: [{ translateY: positionAnim }],
                    }
                ]}
            >
                <View style={[styles.navBar]}>
                    <Animated.View style={[styles.navButtonSelected, {
                        backgroundColor: theme.colors.indicator,
                        transform: [{ translateX: translateAnim }]
                    }]} />
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.navButton}
                        onPress={() => goto(routeMapping.DISCOVERY, 0)}
                        onLayout={(event) => handleLayout(routeMapping.DISCOVERY, event.nativeEvent.layout)}
                    >
                        {renderIcon(routeMapping.DISCOVERY)}
                        {renderLabel(routeMapping.DISCOVERY, '发现')}
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.navButton}
                        onPress={() => goto(routeMapping.SUBSCRIBE, 1)}
                        onLayout={(event) => handleLayout(routeMapping.SUBSCRIBE, event.nativeEvent.layout)}
                    >
                        {renderIcon(routeMapping.SUBSCRIBE)}
                        {renderLabel(routeMapping.SUBSCRIBE, '订阅')}
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.navButton}
                        onPress={() => goto(routeMapping.PROFILE, 2)}
                        onLayout={(event) => handleLayout(routeMapping.PROFILE, event.nativeEvent.layout)}
                    >
                        {renderIcon(routeMapping.PROFILE)}
                        {renderLabel(routeMapping.PROFILE, '我的')}
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    navBarWrapper: {
        width: '100%',
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: "center",
        position: 'relative',
    },
    navButton: {
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "center",
        width: 100,
        height: 48,
    },
    navButtonSelected: {
        position: 'absolute',
        height: 36,
        justifyContent: 'center',
        borderRadius: 20,
        width: 104,
        left: 16,
    },
    navText: {
        fontSize: 14,
        lineHeight: Platform.select({
            android: 20
        }),
        fontWeight: "normal",
        marginLeft: 8
    },
    selectedNavText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 500,
        marginLeft: 8
    }
});