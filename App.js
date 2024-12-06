import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from "@react-navigation/stack";
import {DiscoveryScreen} from "./src/screens/DiscoveryScreen";
import {NewsDetailScreen} from "./src/screens/NewsDetailScreen";
import {NewsProvider} from "./src/providers/NewsProvider";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";
import {AppRegistry, LogBox, Text, TextInput, View} from "react-native";
import {PlaybackService} from "./src/services/PlaybackService";
import {PlayerBar} from "./src/components/PlayerBar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {VisibilityProvider} from "./src/providers/VisibilityProvider";
import {NavBar} from "./src/components/NavBar";
import {SubscribeScreen} from "./src/screens/SubscribeScreen";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {Capability, Event, useTrackPlayerEvents} from "react-native-track-player";
import {storage} from "./src/storage";
import {useTrackStateStore} from "./src/hooks/AudioTrackStore";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import Toast, {BaseToast, ErrorToast} from "react-native-toast-message";

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

export const initializeTrackPlayer = async () => {
    await TrackPlayer.setupPlayer();

    await TrackPlayer.updateOptions({
        progressUpdateEventInterval: 1,
        stopWithApp: true,
        capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.JumpForward,
            Capability.JumpBackward,
            Capability.SeekTo
        ],
        compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.JumpForward,
            Capability.JumpBackward
        ],
        notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.JumpForward,
            Capability.JumpBackward,
            Capability.SeekTo
        ],
        androidCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.JumpForward,
            Capability.JumpBackward
        ],
    });

    useTrackPlayerEvents([
            Event.RemotePause, Event.RemotePlay, Event.RemoteStop,
            Event.RemoteJumpForward, Event.RemoteJumpBackward, Event.RemoteSeek
        ],
        async (event) => {
            switch (event.type) {
                case Event.RemoteSeek:
                    await TrackPlayer.seekTo(event.position);
                    break;
                case Event.RemotePlay:
                    await TrackPlayer.play();
                    break;
                case Event.RemotePause:
                    await TrackPlayer.pause();
                    break;
                case Event.RemoteStop:
                    await TrackPlayer.reset();
                    break;
                case Event.RemoteJumpForward:
                    TrackPlayer.getProgress().then(progress => {
                        let nextPosition = progress.position + event.interval;
                        nextPosition = nextPosition > progress.duration ? progress.duration : nextPosition;
                        TrackPlayer.seekTo(nextPosition);
                    })
                    break;
                case Event.RemoteJumpBackward:
                    TrackPlayer.getProgress().then(progress => {
                        let nextPosition = progress.position - event.interval;
                        nextPosition = nextPosition < 0 ? 0 : nextPosition;
                        TrackPlayer.seekTo(nextPosition);
                    })
                    break;
                default:
                    break;
            }
        });
    console.log('initialize track player');
}

const loadCacheTrackPlay = async () => {
    const currentTrack = storage.getString('currentTrack');
    if (currentTrack) {
        const setPlayerBarShowing = useTrackStateStore.getState().setShowing;
        const setTrack = useTrackStateStore.getState().setTrack;
        const setShrink = useTrackStateStore.getState().setShrink;

        const track = JSON.parse(currentTrack);

        if (track.position >= track.duration) {
            return
        }

        await TrackPlayer.add([track]);
        await TrackPlayer.seekTo(track.position);
        await TrackPlayer.pause();
        setPlayerBarShowing();
        setTrack(track);
        setShrink(true);
        console.log('load exist track from mmkv:', track);
    }
}

initializeTrackPlayer().then(r => loadCacheTrackPlay());

const DiscoveryStackNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            animationEnabled: true,
        }}>
            <Stack.Screen name="DiscoveryScreen" component={DiscoveryScreen} options={{title: '发现'}}/>
            <Stack.Screen name="NewsDetailScreen" component={NewsDetailScreen}
                          options={{title: "资讯详情", headerShown: true}}/>
        </Stack.Navigator>
    );
}

const toastConfig = {
    /*
      Overwrite 'success' type,
      by modifying the existing `BaseToast` component
    */
    success: (props) => (
        <BaseToast
            {...props}
            style={{borderLeftColor: 'pink', zIndex: 1000000}}
            contentContainerStyle={{paddingHorizontal: 15}}
            text1Style={{
                fontSize: 15,
                fontWeight: '400'
            }}
        />
    ),
    /*
      Overwrite 'error' type,
      by modifying the existing `ErrorToast` component
    */
    error: (props) => (
        <ErrorToast
            {...props}
            text1Style={{
                fontSize: 17
            }}
            text2Style={{
                fontSize: 15
            }}
        />
    ),
    tomatoToast: ({ text1, props }) => (
        <View style={{ height: 60, width: '100%', backgroundColor: 'tomato', bottom: 0, zIndex: 1000 }}>
            <Text>{text1}</Text>
            <Text>{props.uuid}</Text>
        </View>
    )
}

export default function App() {
    return (
        <SafeAreaProvider>
            <VisibilityProvider>
                <NewsProvider>
                    <NavigationContainer>
                        <GestureHandlerRootView style={{flex: 1}}>
                            <View style={{flex: 1}}>
                                <Tab.Navigator
                                    initialRouteName="DiscoveryScreen"
                                    screenOptions={{
                                        headerShown: false,
                                        animationEnabled: false,
                                        tabBarStyle: {display: 'none'},
                                    }}
                                >
                                    <Tab.Screen name="DiscoveryStack" component={DiscoveryStackNavigator}/>
                                    <Tab.Screen name="SubscribeScreen" component={SubscribeScreen}/>
                                    <Tab.Screen name="ProfileScreen" component={ProfileScreen}/>
                                </Tab.Navigator>
                                <PlayerBar/>
                                <NavBar/>
                                <Toast config={toastConfig}/>
                            </View>
                        </GestureHandlerRootView>
                    </NavigationContainer>
                </NewsProvider>
            </VisibilityProvider>
        </SafeAreaProvider>
    );
}