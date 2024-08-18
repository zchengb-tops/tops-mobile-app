import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from "@react-navigation/stack";
import {NewsPageScreen} from "./src/NewsPageScreen";
import {NewsDetailScreen} from "./src/NewsDetailScreen";
import {GlobalProvider} from "./utils/GlobalContext";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";
import {AppRegistry} from "react-native";
import {PlaybackService} from "./src/services/PlaybackService";


AppRegistry.registerComponent("tops-mobile-app", () => App);
const Stack = createStackNavigator();
TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function App() {
    return (
        <GlobalProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="NewsPage">
                    <Stack.Screen name="NewsPage" component={NewsPageScreen}
                                  options={{headerShown: false, title: "Tops"}}/>
                    <Stack.Screen name="NewsDetail" component={NewsDetailScreen} options={{title: "资讯详情"}}/>
                </Stack.Navigator>
            </NavigationContainer>
        </GlobalProvider>
    );
}