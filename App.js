import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from "@react-navigation/stack";
import {NewsPageScreen} from "./src/NewsPageScreen";
import {NewsDetailScreen} from "./src/NewsDetailScreen";
import {GlobalProvider} from "./utils/GlobalContext";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";
import {AppRegistry, Text} from "react-native";
import {PlaybackService} from "./src/services/PlaybackService";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";


AppRegistry.registerComponent("tops-mobile-app", () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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

const AccountScreen = () => {
    return <Text>账号</Text>;
}


export default function App() {
    return (
        <GlobalProvider>
            <NavigationContainer>
                <Tab.Navigator initialRouteName="Discover" screenOptions={{headerShown: false}}>
                    <Tab.Screen
                        name="Discover"
                        component={NewsStack}
                        options={{title: "发现"}}
                    />
                    <Tab.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{title: "设置"}}
                    />
                    <Tab.Screen
                        name="Account"
                        component={AccountScreen}
                        options={{title: "账号"}}
                    />
                </Tab.Navigator>
            </NavigationContainer>
        </GlobalProvider>
    );
}