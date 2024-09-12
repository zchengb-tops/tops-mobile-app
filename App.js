import React, {useRef, useState} from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from "@react-navigation/stack";
import {NewsPageScreen} from "./src/NewsPageScreen";
import {NewsDetailScreen} from "./src/NewsDetailScreen";
import {GlobalProvider} from "./utils/GlobalContext";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";
import {
    Animated,
    AppRegistry,
    LogBox, Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import {PlaybackService} from "./src/services/PlaybackService";
import {Icon} from "@rneui/themed";
import {PlayerBar} from "./src/components/PlayerBar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {useVisibility, VisibilityProvider} from "./utils/VisibilityProvider";
import {NavBar} from "./src/components/NavBar";


AppRegistry.registerComponent("tops-mobile-app", () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);
const Stack = createStackNavigator();

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


export default function App() {
    return (
        <SafeAreaProvider>
            <VisibilityProvider>
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
                            <NavBar/>
                        </View>
                    </NavigationContainer>
                </GlobalProvider>
            </VisibilityProvider>
        </SafeAreaProvider>
    );
}