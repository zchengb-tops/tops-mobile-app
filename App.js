import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from "@react-navigation/stack";
import {DiscoveryScreen} from "./src/screens/DiscoveryScreen";
import {NewsDetailScreen} from "./src/screens/NewsDetailScreen";
import {GlobalProvider} from "./utils/GlobalContext";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";
import {AppRegistry, LogBox, Text, TextInput, View} from "react-native";
import {PlaybackService} from "./src/services/PlaybackService";
import {PlayerBar} from "./src/components/PlayerBar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {VisibilityProvider} from "./utils/VisibilityProvider";
import {NavBar} from "./src/components/NavBar";
import {SubscribeScreen} from "./src/screens/SubscribeScreen";


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
                                initialRouteName={"DiscoveryScreen"}
                                screenOptions={{
                                    headerShown: false,
                                    animationEnabled: false
                                }}
                            >
                                <Stack.Screen name="DiscoveryScreen" component={DiscoveryScreen} options={{title: 'Tops'}}/>
                                <Stack.Screen name="SubscribeScreen" component={SubscribeScreen}/>
                                <Stack.Screen name="ProfileScreen" component={ProfileScreen}/>
                                <Stack.Screen
                                    name="NewsDetailScreen"
                                    component={NewsDetailScreen}
                                    options={{title: "资讯详情",  headerShown: true}}
                                />
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