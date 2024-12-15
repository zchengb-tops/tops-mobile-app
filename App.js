import React, {useContext, useEffect} from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createStackNavigator} from "@react-navigation/stack";
import {DiscoveryScreen} from "./src/screens/DiscoveryScreen";
import {NewsDetailScreen} from "./src/screens/NewsDetailScreen";
import {NewsProvider} from "./src/providers/NewsProvider";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";
import {Appearance, AppRegistry, LogBox, TextInput, View} from "react-native";
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
import {ProfileScreen} from "./src/screens/ProfileScreen";
import {Text} from "./src/components/Text";
import {useDarkMode} from "./src/hooks/DarkModeHooks";
import {ThemeContext, ThemeProvider} from "@rneui/themed";
import {TOAST_CONFIG} from "./src/constant";

AppRegistry.registerComponent("tops-mobile-app", () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
Text.defaultProps.style = Text.defaultProps.style || {};

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.style = TextInput.defaultProps.style || {};

LogBox.ignoreAllLogs();

const error = console.error;
console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
};

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

    console.log('initialize track player done');
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

export default function App() {
    // storage.set('channelList', JSON.stringify(DEFAULT_CHANNEL_LIST));
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
                    console.log('Remote stop event received, track player reset');
                    break;
                case Event.RemoteJumpForward:
                    TrackPlayer.getProgress().then(progress => {
                        let nextPosition = progress.position + event.interval;
                        nextPosition = nextPosition > progress.duration ? progress.duration : nextPosition;
                        TrackPlayer.seekTo(nextPosition);
                        console.log('Remote jump forward event received, seeking to position:', nextPosition);
                    })
                    break;
                case Event.RemoteJumpBackward:
                    TrackPlayer.getProgress().then(progress => {
                        let nextPosition = progress.position - event.interval;
                        nextPosition = nextPosition < 0 ? 0 : nextPosition;
                        TrackPlayer.seekTo(nextPosition);
                        console.log('Remote jump backward event received, seeking to position:', nextPosition);
                    })
                    break;
                default:
                    console.log('Unhandled remote event received:', event.type);
                    break;
            }
        });

    const isDarkMode = useDarkMode();
    const {updateTheme} = useContext(ThemeContext);

    const theme = {
        isDarkMode: isDarkMode,
        colors: {
            background: isDarkMode ? '#1A1A1A' : '#FFF',
            text: isDarkMode ? '#FFFFFF' : '#464646',
            secondaryText: isDarkMode ? '#AAAAAA' : '#939393',
            card: isDarkMode ? '#2A2A2A' : '#F7F7F7',
            primary: '#F76F00',
            border: isDarkMode ? '#3A3A3A' : '#E8E8E8',
            indicator: isDarkMode ? '#F76F00' : '#404040',
            inputBackground: isDarkMode ? '#1C1C1E' : '#F7F7F7',
            modalBackground: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        },
    };

    useEffect(() => {
        console.log('need update theme...', isDarkMode);
        updateTheme && updateTheme(theme);
    }, [isDarkMode]);

    return (
        <SafeAreaProvider>
            <ThemeProvider theme={theme}>
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
                                    <Toast config={TOAST_CONFIG}/>
                                </View>
                            </GestureHandlerRootView>
                        </NavigationContainer>
                    </NewsProvider>
                </VisibilityProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}