import React, {useRef, useState} from "react";
import {Animated, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {useVisibility} from "../../utils/VisibilityProvider";
import {Icon} from "@rneui/themed";

export const NavBar = () => {
    const routeMapping = {
        HOME: 'HomeScreen',
        SETTING: 'SettingsScreen',
        PROFILE: 'ProfileScreen',
    }
    const [currentRoute, setCurrentRoute] = useState(routeMapping.HOME);
    const translateAnim = useRef(new Animated.Value(0)).current;
    const tabRefs = useRef({});
    const {isVisible} = useVisibility();

    const handleLayout = (screenName, layout) => {
        tabRefs.current[screenName] = layout;
    };

    const renderLabel = (screenName, label) => {
        return <Text style={[styles.navText, currentRoute === screenName && styles.selectedNavText]}>{label}</Text>;
    };

    const renderIcon = (screenName) => {
        switch (screenName) {
            case routeMapping.HOME:
                return currentRoute === screenName
                    ?
                    <Icon
                        size={24}
                        name='navigate-circle-outline'
                        type='ionicon'
                        color='#f5f5f5'
                    />
                    :
                    <Icon
                        size={24}
                        name='navigate-circle-outline'
                        type='ionicon'
                        color='#949494'
                    />;
            case routeMapping.PROFILE:
                return currentRoute === screenName
                    ?
                    <Icon
                        size={24}
                        name='person-circle-outline'
                        type='ionicon'
                        color='#F5F5F5'
                    />
                    :
                    <Icon
                        size={24}
                        name='person-circle-outline'
                        type='ionicon'
                        color='#949494'
                    />;
            case routeMapping.SETTING:
                return currentRoute === screenName
                    ?
                    <Icon
                        size={20}
                        name='logo-rss'
                        type='ionicon'
                        color='#f5f5f5'
                    />
                    :
                    <Icon
                        size={20}
                        name='logo-rss'
                        type='ionicon'
                        color='#949494'
                    />;
        }
    }

    const goto = (routeName, index) => {
        const {x} = tabRefs.current[routeName];

        Animated.spring(translateAnim, {
            toValue: x - 16,
            useNativeDriver: true,
        }).start();

        setCurrentRoute(routeName);
        // navigation.navigate(routeName);
    }

    if (!isVisible) return null;

    return (
        <SafeAreaView style={{backgroundColor: '#F5F5F5'}}>
            <View style={styles.navBar}>
                <Animated.View style={[styles.navButtonSelected, {transform: [{translateX: translateAnim}]}]}/>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => goto(routeMapping.HOME, 0)}
                    onLayout={(event) => handleLayout(routeMapping.HOME, event.nativeEvent.layout)}
                >
                    {renderIcon(routeMapping.HOME)}
                    {renderLabel(routeMapping.HOME, '发现')}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => goto(routeMapping.SETTING, 1)}
                    onLayout={(event) => handleLayout(routeMapping.SETTING, event.nativeEvent.layout)}
                >
                    {renderIcon(routeMapping.SETTING)}
                    {renderLabel(routeMapping.SETTING, '订阅')}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => goto(routeMapping.PROFILE, 2)}
                    onLayout={(event) => handleLayout(routeMapping.PROFILE, event.nativeEvent.layout)}
                >
                    {renderIcon(routeMapping.PROFILE)}
                    {renderLabel(routeMapping.PROFILE, '账号')}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: "center",
        backgroundColor: '#F5F5F5',
        position: 'relative',
        paddingVertical: 12
    },
    navButton: {
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "center",
        width: 100,
        height: 24,
    },
    navButtonSelected: {
        position: 'absolute',
        height: 36,
        backgroundColor: '#404040',
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
        color: '#464646',
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
