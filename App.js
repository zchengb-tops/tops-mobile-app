import React, {useContext, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from "@react-navigation/stack";
import {DiscoveryScreen} from "./src/screens/DiscoveryScreen";
import {NewsDetailScreen} from "./src/screens/NewsDetailScreen";
import * as TrackPlayer from "react-native-track-player/src/trackPlayer";
import {AppRegistry, LogBox, TextInput, View, StatusBar, Platform} from "react-native";
import SystemNavigationBar from "react-native-system-navigation-bar";
import {PlaybackService} from "./src/services/PlaybackService";
import {initializeTrackPlayer, PlayerBar} from "./src/components/PlayerBar";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {VisibilityProvider} from "./src/providers/VisibilityProvider";
import {NavBar} from "./src/components/NavBar";
import {SubscribeScreen} from "./src/screens/SubscribeScreen";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {Event, useTrackPlayerEvents} from "react-native-track-player";
import {storage} from "./src/storage";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {ProfileScreen} from "./src/screens/ProfileScreen";
import {Text} from "./src/components/Text";
import {useDarkMode} from "./src/hooks/DarkModeHooks";
import {ThemeContext, ThemeProvider, useTheme} from "@rneui/themed";
import {UserPrivacyAgreementScreen} from "./src/screens/UserPrivacyAgreementScreen";
import {UserServiceAgreementScreen} from "./src/screens/UserServiceAgreementScreen";
import {useTrackStateStore} from "./src/hooks/TrackHooks";
import {enableLayoutAnimations} from "react-native-reanimated";
import {useVersionCheck} from "./src/hooks/VersionHooks";
import UpgradeModal from "./src/components/UpgradeModal";

AppRegistry.registerComponent("tops-mobile-app", () => App);
TrackPlayer.registerPlaybackService(() => PlaybackService);

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
Text.defaultProps.style = Text.defaultProps.style || {};

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
TextInput.defaultProps.style = TextInput.defaultProps.style || {};
enableLayoutAnimations(true);
LogBox.ignoreAllLogs();

const error = console.error;
console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
};

const Tab = createBottomTabNavigator();

const Stack = createStackNavigator();

const loadCacheTrackPlay = async () => {
    const currentTrack = storage.getString('currentTrack');

    if (currentTrack) {
        const setPlayerBarShowing = useTrackStateStore.getState().setShowing;
        const setTrack = useTrackStateStore.getState().setTrack;

        const track = JSON.parse(currentTrack);

        if (track.position >= track.duration) {
            return
        }

        await TrackPlayer.add([track]);
        await TrackPlayer.seekTo(track.position);
        await TrackPlayer.pause();
        setPlayerBarShowing();
        setTrack(track);
        console.log('load exist track from mmkv:', track);
    }
}

const DiscoveryStackNavigator = () => {
    const { theme } = useTheme();

    return (
        <Stack.Navigator screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            animationEnabled: true,
            headerStyle: {
                backgroundColor: theme.colors.background
            },
            headerTintColor: theme.colors.text
        }}>
            <Stack.Screen name="DiscoveryScreen" component={DiscoveryScreen} options={{title: 'InfoHub'}}/>
            <Stack.Screen name="NewsDetailScreen" component={NewsDetailScreen}
                          options={{title: "资讯详情", headerShown: true}}/>
        </Stack.Navigator>
    );
}

export default function App() {
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
    const { updateInfo, showModal, hideModal } = useVersionCheck();

    const theme = {
        isDarkMode: isDarkMode,
        colors: {
            background: isDarkMode ? '#1A1A1A' : '#FFF',
            text: isDarkMode ? '#FFFFFF' : '#464646',
            secondaryText: isDarkMode ? '#AAAAAA' : '#939393',
            card: isDarkMode ? '#2A2A2A' : '#F7F7F7',
            primary: '#F76F00',
            darkPrimary: '#404040',
            border: isDarkMode ? '#3A3A3A' : '#E8E8E8',
            deepBorder: isDarkMode ? '#2A2A2A' : '#939393',
            indicator: isDarkMode ? '#F76F00' : '#404040',
            inputBackground: isDarkMode ? '#1C1C1E' : '#F7F7F7',
            modalBackground: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        },
    };

    useEffect(() => {
        console.log('need update theme...', isDarkMode);
        updateTheme && updateTheme(theme);
        
        if (Platform.OS === 'android') {
            SystemNavigationBar.setNavigationColor(
                isDarkMode ? '#000' : '#FFFFFF',
                !isDarkMode
            );
        }
    }, [isDarkMode]);

    useEffect(() => {
        const initializePlayer = async () => {
            try {
                await initializeTrackPlayer();
                await loadCacheTrackPlay();
                console.log('initialize player success');
            } catch (e) {
                if (!e.message.includes('already been initialized')) {
                    console.error('Failed to initialize player:', e);
                }
            }
        };

        initializePlayer();

        return () => {
            TrackPlayer?.destroy && TrackPlayer?.destroy();
        };
    }, []);



    return (
        <SafeAreaProvider>
            <ThemeProvider theme={theme}>
                <VisibilityProvider>
                    <NavigationContainer>
                        <GestureHandlerRootView style={{flex: 1}}>
                            <StatusBar 
                                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                                backgroundColor={isDarkMode ? '#1A1A1A' : '#FFFFFF'}
                                translucent={Platform.OS === 'android'}
                            />
                            <View style={{
                                flex: 1,
                                backgroundColor: isDarkMode ? '#000000' : '#FFFFFF'
                            }}>
                                <Stack.Navigator 
                                    screenOptions={{
                                        headerShown: false,
                                        headerStyle: {
                                            backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF'
                                        },
                                        headerTintColor: isDarkMode ? '#FFFFFF' : '#464646'
                                    }}
                                >
                                    <Stack.Screen name="InfoHub">
                                        {() => (
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
                                        )}
                                    </Stack.Screen>
                                    <Stack.Screen 
                                        name="UserPrivacyAgreementScreen" 
                                        component={UserPrivacyAgreementScreen} 
                                        options={{title: "隐私协议", headerShown: true}}
                                    />
                                    <Stack.Screen 
                                        name="UserServiceAgreementScreen" 
                                        component={UserServiceAgreementScreen}
                                        options={{title: "用户协议", headerShown: true}}
                                    />
                                </Stack.Navigator>
                                <PlayerBar/>
                                <NavBar/>
                                <UpgradeModal 
                                    isVisible={showModal}
                                    onClose={hideModal}
                                    updateInfo={updateInfo}
                                />
                            </View>
                        </GestureHandlerRootView>
                    </NavigationContainer>
                </VisibilityProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}