import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from "@react-navigation/stack";
import {DiscoveryScreen} from "./src/screens/DiscoveryScreen";
import {NewsDetailScreen} from "./src/screens/NewsDetailScreen";
import {NewsProvider} from "./utils/NewsProvider";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";
import {AppRegistry, LogBox, Text, TextInput, View} from "react-native";
import {PlaybackService} from "./src/services/PlaybackService";
import {PlayerBar} from "./src/components/PlayerBar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {VisibilityProvider} from "./utils/VisibilityProvider";
import {NavBar} from "./src/components/NavBar";
import {SubscribeScreen} from "./src/screens/SubscribeScreen";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";


AppRegistry.registerComponent("tops-mobile-app", () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

LogBox.ignoreAllLogs();

const error = console.error;
console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
};

const ProfileScreen = () => {
    return <Text>账号</Text>;
}


const Tab = createBottomTabNavigator();

const Stack = createStackNavigator();

const DiscoveryStackNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            animationEnabled: true,
        }}>
            <Stack.Screen name="DiscoveryScreen" component={DiscoveryScreen} options={{title: '发现'}} />
            <Stack.Screen name="NewsDetailScreen" component={NewsDetailScreen}  options={{title: "资讯详情",  headerShown: true}} />
        </Stack.Navigator>
    );
}
export default function App() {
    return (
        <SafeAreaProvider>
            <VisibilityProvider>
                <NewsProvider>
                    <NavigationContainer>
                        <View style={{flex: 1}}>
                            <Tab.Navigator
                                initialRouteName="DiscoveryScreen"
                                screenOptions={{
                                    headerShown: false,
                                    animationEnabled: false,
                                    tabBarStyle: { display: 'none' },
                                }}
                            >
                                <Tab.Screen name="DiscoveryStack" component={DiscoveryStackNavigator} />
                                <Tab.Screen name="SubscribeScreen" component={SubscribeScreen} />
                                <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
                            </Tab.Navigator>
                            <PlayerBar/>
                            <NavBar/>
                        </View>
                    </NavigationContainer>
                </NewsProvider>
            </VisibilityProvider>
        </SafeAreaProvider>
    );
}