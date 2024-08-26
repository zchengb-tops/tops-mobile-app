import React, {useRef, useState} from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from "@react-navigation/stack";
import {NewsPageScreen} from "./src/NewsPageScreen";
import {NewsDetailScreen} from "./src/NewsDetailScreen";
import {GlobalProvider} from "./utils/GlobalContext";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";
import {Animated, AppRegistry, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {PlaybackService} from "./src/services/PlaybackService";
import {Icon} from "@rneui/themed";
import {PlayerBar} from "./src/components/PlayerBar";
import {SafeAreaProvider} from "react-native-safe-area-context";


AppRegistry.registerComponent("tops-mobile-app", () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);
const Stack = createStackNavigator();

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

const error = console.error;
console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
};

function NewsStack() {
    return (
        <Stack.Navigator initialRouteName="NewsPage">
            <Stack.Screen
                name="NewsPage"
                component={NewsPageScreen}
                options={{headerShown: false, title: "Tops"}}
            />
            <Stack.Screen
                name="NewsDetail"
                component={NewsDetailScreen}
                options={{title: "资讯详情"}}
            />
        </Stack.Navigator>
    );
}

const SettingsScreen = () => {
    return <Text>设置页</Text>;
}

const ProfileScreen = () => {
    return <Text>账号</Text>;
}

const CustomNavBar = () => {
    const routeMapping = {
        HOME: 'HomeScreen',
        SETTING: 'SettingsScreen',
        PROFILE: 'ProfileScreen',
    }
    const [currentRoute, setCurrentRoute] = useState(routeMapping.HOME);
    const translateAnim = useRef(new Animated.Value(0)).current;
    const tabRefs = useRef({});  // Store references to the tab layout info

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


export default function App() {
    return (
        <SafeAreaProvider>
            <GlobalProvider>
                <NavigationContainer>
                    <View style={{flex: 1}}>
                        <Stack.Navigator
                            screenOptions={{
                                headerShown: false,
                            }}
                        >
                            <Stack.Screen name="HomeScreen" component={NewsStack}/>
                            <Stack.Screen name="ProfileScreen" component={ProfileScreen}/>
                            <Stack.Screen name="SettingsScreen" component={SettingsScreen}/>
                        </Stack.Navigator>
                        <PlayerBar/>
                        <CustomNavBar/>
                    </View>
                </NavigationContainer>
            </GlobalProvider>
        </SafeAreaProvider>
    );
}

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