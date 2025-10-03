import {useIsFocused, useNavigation} from '@react-navigation/native';
import {Icon, useTheme} from "@rneui/themed";
import * as Application from 'expo-application';
import React, {useEffect, useState, useRef} from "react";
import {Alert, Image, Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, View, Animated} from "react-native";
import {logEvent} from "../analytics";
import {
    getUserNewsChannelConfig,
    getUserNewsChannelConfigCurrentVersion,
    updateUserNewsChannelConfig
} from "../apis/User";
import AboutModal from "../components/AboutModal";
import DarkModeModal from "../components/DarkModeModal";
import FontSizeModal from "../components/FontSizeModal";
import LoginModal from "../components/LoginModal";
import SyncModal from "../components/SyncModal";
import {FONT_SIZE, Text} from "../components/Text";
import {DEFAULT_AVATAR} from "../constant";
import {useAuth} from '../hooks/AuthHooks';
import {useDarkMode, useDarkModeValue} from '../hooks/DarkModeHooks';
import {storage} from "../storage";
import useNewsStore from '../stores/useNewsStore';
import {useTopInset} from "../hooks/useTopInset";
export const ProfileScreen = ({ 
    checkForUpdates, 
    isVersionCheckLoading, 
    clearVersionCache 
}) => {
    const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);
    const spinValue = useRef(new Animated.Value(0)).current;
    const [darkModeModalVisible, setDarkModeModalVisible] = useState(false);
    const [loginModalVisible, setLoginModalVisible] = useState(false);
    const [aboutModalVisible, setAboutModalVisible] = useState(false);
    const [syncModalVisible, setSyncModalVisible] = useState(false);
    const [fontSize, setFontSize] = useState(storage.getString('fontSize') || FONT_SIZE.MEDIUM);
    const [isSyncEnabled, setIsSyncEnabled] = useState(storage.getBoolean('isSyncEnabled') ?? false);
    const isDarkMode = useDarkMode();
    const {theme} = useTheme();
    const darkMode = useDarkModeValue();
    const isFocused = useIsFocused();
    const navigation = useNavigation();
    const {isLoggedIn, userInfo, loadUserInfo, logout} = useAuth();
    const darkModes = [
        {value: 'system', label: '跟随系统'},
        {value: 'light', label: '浅色模式'},
        {value: 'dark', label: '深色模式'}
    ];
    const topInset = useTopInset();
    const fetchDefaultChannels = useNewsStore(state => state.fetchDefaultChannels);

    // Spinning animation for loading icon
    useEffect(() => {
        if (isVersionCheckLoading) {
            const spinAnimation = Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            );
            spinAnimation.start();
            return () => spinAnimation.stop();
        } else {
            spinValue.setValue(0);
        }
    }, [isVersionCheckLoading, spinValue]);

    useEffect(() => {
        logEvent('screen_view', {
            screen_name: 'ProfileScreen',
            page_title: 'ProfileScreen'
        });
    }, [isFocused]);


    useEffect(() => {
        const subscription = storage.addOnValueChangedListener((key) => {
            if (key === 'isSyncEnabled') {
                setIsSyncEnabled(storage.getBoolean('isSyncEnabled') ?? false);
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const fetchUserNewsChannelConfig = async () => {
        if (!isLoggedIn) {
            console.log('no access token, skip fetch user news channel config');
            return;
        }
        const localVersion = storage.getString('newsChannelConfigVersion');
        const response = await getUserNewsChannelConfigCurrentVersion();
        const {version: serverVersion} = await response.json();
        const channelSettings = JSON.parse(storage.getString('channelList')) || await fetchDefaultChannels();

        if (!serverVersion) {
            console.log('no server version, update user news channel config');
            updateUserNewsChannelConfig(channelSettings).then(async response => {
                const data = await response.json();
                if (response.ok) {
                    const {newVersion} = data;
                    updateChannelConfigVersion(newVersion);
                    updateLastSyncTime();
                    console.log('update user news channel config success, new version:', storage.getString('newsChannelConfigVersion'));
                } else {
                    throw new Error(data?.message || '更新订阅配置失败');
                }
            }).catch(e => console.error('update user news channel config error', e));
        } else if (localVersion === undefined || (serverVersion && serverVersion.toString() !== localVersion)) {
            console.log('server version is not equal to local version, update user news channel config');
            Alert.alert(
                '同步订阅配置',
                '是否同步云端最新的订阅配置？\n⚠️注意：这将覆盖本地配置',
                [
                    {
                        text: '取消',
                        style: 'cancel'
                    },
                    {
                        style: 'destructive',
                        text: '确定',
                        onPress: () => fetchUserNewsChannelConfigFromServer()
                    }
                ]
            );
        }
    };

    const updateChannelConfigVersion = (version) => {
        storage.set('newsChannelConfigVersion', version?.toString() || undefined);
    }

    const updateLastSyncTime = () => {
        const now = new Date().toLocaleString();
        storage.set('lastSyncTime', now);
    }

    const fetchUserNewsChannelConfigFromServer = async () => {
        getUserNewsChannelConfig().then(async response => {
            if (response.ok) {
                const data = await response.json();
                const version = data.version;
                const channelSettings = data.content;
                storage.set('channelList', channelSettings);
                updateChannelConfigVersion(version);
                updateLastSyncTime();
                console.log('fetch user news channel config from server success');
            } else {
                throw new Error(await response.json());
            }
        }).catch(e => console.error('fetch user news channel config from server error', e));
    };

    const handleLogout = () => {
        Alert.alert(
            '确认退出',
            '确定要退出登录吗？',
            [
                {
                    text: '取消',
                    style: 'cancel'
                },
                {
                    text: '确定',
                    onPress: async () => {
                        await logout();
                        await logEvent('user_logout');
                    }
                }
            ]
        );
    };

    const handleFontSizeChange = (size) => {
        setFontSize(size);
        storage.set('fontSize', size);
        closeFontSizeModal();
    };

    const getDarkModeText = () => {
        const mode = darkModes.find(m => m.value === darkMode);
        return mode ? mode.label : '';
    };

    const closeFontSizeModal = () => {
        setFontSizeModalVisible(false);
    }

    const closeLoginModal = () => {
        setLoginModalVisible(false);
    }

    const onLoginSuccess = async (token) => {
        storage.set('accessToken', token);
        await loadUserInfo();
        closeLoginModal();
        fetchUserNewsChannelConfig();
        await logEvent('user_login_success');
    }

    const promptLoginForSync = () => {
        if (!isLoggedIn) {
            Alert.alert('请先登录', '登录后即可开启同步功能', [
                {
                    text: '取消',
                    style: 'cancel'
                },
                {
                    style: 'destructive',
                    text: '前往登录',
                    onPress: async () => {
                        await logEvent('open_login_modal', {
                            source: 'sync_settings'
                        });
                        setLoginModalVisible(true);
                    }
                }
            ]);
        }
    }

    const openSyncModal = () => {
        if (!isLoggedIn) {
            promptLoginForSync();
            return;
        }
        setSyncModalVisible(true);
    }

    return <View
        style={[
            styles.container,
            {
                backgroundColor: theme.colors.background,
                paddingTop: topInset
            }
        ]}
    >
        <ScrollView>
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.profileWrapper}
                onPress={userInfo ? undefined : async () => {
                    await logEvent('open_login_modal', {
                        source: 'profile_header'
                    });
                    setLoginModalVisible(true);
                }}
            >
                {
                    isLoggedIn ? (
                        <Image style={styles.avatar} source={{uri: userInfo?.avatar || DEFAULT_AVATAR}}/>
                    ) : (
                        <Image source={require('../../assets/images/default-avatar.png')} style={styles.avatar}/>
                    )
                }
                <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, {color: theme.colors.text}]}>
                        {userInfo?.name || '未登录'}
                    </Text>
                    <Text style={[styles.profileDesc, {color: theme.colors.secondaryText}]}>
                        {userInfo?.email || '登录后即可同步资讯订阅至云端'}
                    </Text>
                </View>
                {userInfo && (
                    <TouchableOpacity
                        style={[styles.logoutButton, {backgroundColor: theme.colors.card}]}
                        onPress={handleLogout}
                    >
                        <Icon
                            name="log-out-outline"
                            type="ionicon"
                            size={24}
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            <View
                style={[styles.settingList, styles.firstGroup, {backgroundColor: theme.colors.card}]}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
                    onPress={openSyncModal}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="sync-outline" type="ionicon" size={20} color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>同步设置</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={[styles.settingValue, {color: theme.colors.secondaryText}]}>
                            {isSyncEnabled ? '已开启' : '已关闭'}
                        </Text>
                        <Icon name="chevron-forward-outline" type="ionicon" size={20}
                              color={theme.colors.secondaryText}/>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
                    onPress={() => setFontSizeModalVisible(true)}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="text-outline" type="ionicon" size={20} color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>字体大小</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text
                            style={[styles.settingValue, {color: theme.colors.secondaryText}]}>{fontSize}</Text>
                        <Icon name="chevron-forward-outline" type="ionicon" size={20}
                              color={theme.colors.secondaryText}/>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
                    onPress={async () => {
                        await logEvent('open_dark_mode_modal');
                        setDarkModeModalVisible(true);
                    }}
                >
                    <View style={styles.settingLeft}>
                        <Icon name={isDarkMode ? "moon" : "moon-outline"} type="ionicon" size={20}
                              color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>深色模式</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text
                            style={[styles.settingValue, {color: theme.colors.secondaryText}]}>{getDarkModeText()}</Text>
                        <Icon name="chevron-forward-outline" type="ionicon" size={20}
                              color={theme.colors.secondaryText}/>
                    </View>
                </TouchableOpacity>
            </View>

            <View
                style={[styles.settingList, styles.secondGroup, {backgroundColor: theme.colors.card}]}>
                <View style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}>
                    <View style={styles.settingLeft}>
                        <Icon name="phone-portrait-outline" type="ionicon" size={20} color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>当前版本</Text>
                    </View>
                    <Text
                        style={[styles.settingValue, {color: theme.colors.secondaryText}]}>{Application.nativeApplicationVersion || '未知'}{Platform.OS === 'ios' ? ` (${Application.nativeBuildVersion})` : ''}</Text>
                </View>

                <TouchableOpacity
                    activeOpacity={isVersionCheckLoading ? 1 : 0.8}
                    style={[
                        styles.settingItem, 
                        {
                            borderBottomColor: theme.colors.border,
                            opacity: isVersionCheckLoading ? 0.6 : 1
                        }
                    ]}
                    onPress={async () => {
                        if (isVersionCheckLoading) return;
                        
                        console.log('🔘 Manual version check button pressed');
                        await logEvent('manual_version_check');
                        clearVersionCache();
                        await checkForUpdates(true);
                    }}
                    disabled={isVersionCheckLoading}
                >
                    <View style={styles.settingLeft}>
                        {isVersionCheckLoading ? (
                            <Animated.View
                                style={{
                                    transform: [{
                                        rotate: spinValue.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '360deg']
                                        })
                                    }]
                                }}
                            >
                                <Icon 
                                    name="refresh" 
                                    type="ionicon" 
                                    size={20} 
                                    color={theme.colors.secondaryText}
                                />
                            </Animated.View>
                        ) : (
                            <Icon 
                                name="download-outline" 
                                type="ionicon" 
                                size={20} 
                                color={theme.colors.text}
                            />
                        )}
                        <Text style={[
                            styles.settingText, 
                            {
                                color: theme.colors.text
                            }
                        ]}>
                            检查更新
                        </Text>
                    </View>
                    {!isVersionCheckLoading && (
                        <Icon name="chevron-forward-outline" type="ionicon" size={20}
                              color={theme.colors.secondaryText}/>
                    )}
                </TouchableOpacity>


                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
                    onPress={() => Linking.openURL('https://jsj.top/f/T4STLU')}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="chatbox-outline" type="ionicon" size={20} color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>意见反馈</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20}
                          color={theme.colors.secondaryText}/>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
                    onPress={() => navigation.navigate('UserServiceAgreementScreen')}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="document-text-outline" type="ionicon" size={20} color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>用户协议</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20}
                          color={theme.colors.secondaryText}/>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
                    onPress={() => navigation.navigate('UserPrivacyAgreementScreen')}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="shield-checkmark-outline" type="ionicon" size={20} color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>隐私政策</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20}
                          color={theme.colors.secondaryText}/>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
                    onPress={() => setAboutModalVisible(true)}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="information-circle-outline" type="ionicon" size={20}
                              color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>关于</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20}
                          color={theme.colors.secondaryText}/>
                </TouchableOpacity>
            </View>
        </ScrollView>

        <FontSizeModal
            isVisible={fontSizeModalVisible}
            onClose={() => setFontSizeModalVisible(false)}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
        />
        <DarkModeModal
            isVisible={darkModeModalVisible}
            onClose={() => setDarkModeModalVisible(false)}
        />
        <SyncModal isVisible={syncModalVisible}
                   onClose={() => setSyncModalVisible(false)}
                   toLogin={() => setLoginModalVisible(true)}
        />
        <AboutModal
            isVisible={aboutModalVisible}
            onClose={() => setAboutModalVisible(false)}
        />
        <LoginModal
            isVisible={loginModalVisible}
            setIsVisible={setLoginModalVisible}
            onClose={closeLoginModal}
            onSuccess={onLoginSuccess}
        />
    </View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileWrapper: {
        flexDirection: 'row',
        height: 100,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 48,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4
    },
    profileDesc: {
        fontSize: 14,
    },
    logoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    settingList: {
        paddingHorizontal: 24,
        borderRadius: 10,
        marginHorizontal: 16,
    },
    firstGroup: {
        marginTop: 35,
    },
    secondGroup: {
        marginTop: 35,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    settingText: {
        fontSize: 16,
        marginLeft: 12
    },
    settingValue: {
        fontSize: 16,
        marginRight: 4
    }
});

export default ProfileScreen;