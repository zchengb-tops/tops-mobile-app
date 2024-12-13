import {Icon, useTheme} from "@rneui/themed";
import React, {useEffect, useState} from "react";
import {Image, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View} from "react-native";
import Modal from "react-native-modal";
import {Text} from "../components/Text";
import {FONT_SIZE} from "../constant";
import {useDarkMode, useDarkModeValue} from '../hooks/DarkModeHooks';
import {storage} from "../storage";
import {useDarkModeStore} from "../hooks/DarkModeStore";
import LoginModal from "../components/LoginModal";

export const ProfileScreen = () => {
    const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);
    const [darkModeModalVisible, setDarkModeModalVisible] = useState(false);
    const [loginModalVisible, setLoginModalVisible] = useState(false);
    const [selectedFontSize, setSelectedFontSize] = useState(storage.getString('fontSize') || FONT_SIZE.MEDIUM);
    const [accessToken, setAccessToken] = useState(storage.getString('accessToken'));
    const [userInfo, setUserInfo] = useState(null);
    const setDarkMode = useDarkModeStore.getState().setDarkMode;
    const isDarkMode = useDarkMode();
    const {theme} = useTheme();
    const darkMode = useDarkModeValue();

    const fontSizes = [FONT_SIZE.SMALL, FONT_SIZE.MEDIUM, FONT_SIZE.LARGE];
    const darkModes = [
        {value: 'system', label: '跟随系统'},
        {value: 'light', label: '浅色模式'},
        {value: 'dark', label: '深色模式'}
    ];

    useEffect(() => {
        if (accessToken) {
            fetchUserInfo();
        }
    }, [accessToken]);

    const fetchUserInfo = async () => {
        try {
            const response = await fetch('http://localhost:8080/user/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUserInfo({
                    ...data,
                    avatar: data.avatar || 'https://kuoyio.cn/_next/image?url=https%3A%2F%2Fkuoyio-image.oss-cn-shenzhen.aliyuncs.com%2Favatar%2F20240222155915.webp&w=128&q=75'
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        storage.delete('accessToken');
        setAccessToken(null);
        setUserInfo(null);
    };

    const handleFontSizeChange = (size) => {
        setSelectedFontSize(size);
        storage.set('fontSize', size);
        closeFontSizeModal();
    };

    const handleDarkModeChange = (mode) => {
        setDarkMode(mode);
        closeDarkModeModal();
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

    const onLoginSuccess = (token) => {
        storage.set('accessToken', token);
        setAccessToken(token);
        closeLoginModal();
    }

    const renderFontSizeModal = () => (
        <Modal
            isVisible={fontSizeModalVisible}
            style={{margin: 0}}
            backdropOpacity={0.5}
            onBackdropPress={() => closeFontSizeModal()}
            onSwipeComplete={() => closeFontSizeModal()}
            backdropTransitionOutTiming={0}
            swipeDirection="down"
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: theme.colors.background}]}>
                    <View style={styles.modalHeader}>
                        <Text
                            style={[styles.modalTitle, {color: theme.colors.text}]}>选择字体大小</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => closeFontSizeModal()}
                        >
                            <Icon name="close-outline" type="ionicon" size={24}
                                  color={theme.colors.text}/>
                        </TouchableOpacity>
                    </View>
                    {fontSizes.map((size) => (
                        <TouchableOpacity
                            key={size}
                            style={[styles.fontSizeOption, {borderBottomColor: theme.colors.border}]}
                            onPress={() => handleFontSizeChange(size)}
                        >
                            <Text
                                style={[styles.fontSizeText, {color: theme.colors.text}]}>{size}</Text>
                            {selectedFontSize === size && (
                                <Icon name="checkmark-outline" type="ionicon" size={20}
                                      color={theme.colors.text}/>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    const closeDarkModeModal = () => {
        setDarkModeModalVisible(false);
    }

    const renderDarkModeModal = () => (
        <Modal
            isVisible={darkModeModalVisible}
            style={{margin: 0}}
            backdropOpacity={0.5}
            onBackdropPress={() => closeDarkModeModal()}
            onSwipeComplete={() => closeDarkModeModal()}
            backdropTransitionOutTiming={0}
            swipeDirection="down"
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: theme.colors.background}]}>
                    <View style={styles.modalHeader}>
                        <Text
                            style={[styles.modalTitle, {color: theme.colors.text}]}>选择显示模式</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => closeDarkModeModal()}
                        >
                            <Icon name="close-outline" type="ionicon" size={24}
                                  color={theme.colors.text}/>
                        </TouchableOpacity>
                    </View>
                    {darkModes.map((mode) => (
                        <TouchableOpacity
                            key={mode.value}
                            style={[styles.fontSizeOption, {borderBottomColor: theme.colors.border}]}
                            onPress={() => handleDarkModeChange(mode.value)}
                        >
                            <Text
                                style={[styles.fontSizeText, {color: theme.colors.text}]}>{mode.label}</Text>
                            {darkMode === mode.value && (
                                <Icon name="checkmark-outline" type="ionicon" size={20}
                                      color={theme.colors.text}/>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    return <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <ScrollView>
            <View style={styles.profileWrapper}>
                {
                    accessToken ? (
                        <Image style={styles.avatar} source={{uri: userInfo?.avatar}}/>
                    ) : (
                        <View style={[styles.avatar, {backgroundColor: theme.colors.indicator}]}>
                        </View>
                    )
                }
                <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, {color: theme.colors.text}]}>
                        {userInfo?.name || '未登录'}
                    </Text>
                    <Text style={[styles.profileDesc, {color: theme.colors.secondaryText}]}>
                        {userInfo?.email || '点击右侧按钮登录'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.logoutButton, {backgroundColor: theme.colors.card}]}
                    onPress={userInfo ? handleLogout : () => setLoginModalVisible(true)}
                >
                    <Icon
                        name={userInfo ? "log-out-outline" : "log-in-outline"}
                        type="ionicon"
                        size={24}
                        color={theme.colors.text}
                    />
                </TouchableOpacity>
            </View>

            <View
                style={[styles.settingList, styles.firstGroup, {backgroundColor: theme.colors.card}]}>
                <TouchableOpacity style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}>
                    <View style={styles.settingLeft}>
                        <Icon name="sync-outline" type="ionicon" size={20} color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>同步管理</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20}
                          color={theme.colors.secondaryText}/>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
                    onPress={() => setFontSizeModalVisible(true)}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="text-outline" type="ionicon" size={20} color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>字体大小</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text
                            style={[styles.settingValue, {color: theme.colors.secondaryText}]}>{selectedFontSize}</Text>
                        <Icon name="chevron-forward-outline" type="ionicon" size={20}
                              color={theme.colors.secondaryText}/>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}
                                  onPress={() => setDarkModeModalVisible(true)}>
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
                <TouchableOpacity style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}>
                    <View style={styles.settingLeft}>
                        <Icon name="chatbox-outline" type="ionicon" size={20} color={theme.colors.text}/>
                        <Text style={[styles.settingText, {color: theme.colors.text}]}>意见反馈</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20}
                          color={theme.colors.secondaryText}/>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, {borderBottomColor: theme.colors.border}]}>
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

        {renderFontSizeModal()}
        {renderDarkModeModal()}
        <LoginModal 
            isVisible={loginModalVisible}
            onClose={closeLoginModal}
            onSuccess={onLoginSuccess}
        />
    </SafeAreaView>;
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end'
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4
    },
    fontSizeOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    fontSizeText: {
        fontSize: 16,
    }
});

export default ProfileScreen;