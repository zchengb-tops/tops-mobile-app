import React, {useState, useEffect} from "react";
import {
    Image,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
    Modal,
    useColorScheme
} from "react-native";
import {Icon} from "@rneui/themed";
import {storage} from "../storage";
import {FONT_SIZE, getTheme} from "../constant";
import {Text} from "../components/Text";
import { useDarkMode } from '../hooks/useDarkMode';

export const ProfileScreen = () => {
    const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);
    const [darkModeModalVisible, setDarkModeModalVisible] = useState(false);
    const [selectedFontSize, setSelectedFontSize] = useState(storage.getString('fontSize') || FONT_SIZE.MEDIUM);
    const { darkMode, isDarkMode, setDarkMode } = useDarkMode();

    const fontSizes = [FONT_SIZE.SMALL, FONT_SIZE.MEDIUM, FONT_SIZE.LARGE];
    const darkModes = [
        {value: 'system', label: '跟随系统'},
        {value: 'light', label: '浅色模式'},
        {value: 'dark', label: '深色模式'}
    ];

    const handleFontSizeChange = (size) => {
        setSelectedFontSize(size);
        storage.set('fontSize', size);
        setFontSizeModalVisible(false);
    };

    const handleDarkModeChange = (mode) => {
        setDarkMode(mode);
        setDarkModeModalVisible(false);
    };

    const getDarkModeText = () => {
        const mode = darkModes.find(m => m.value === darkMode);
        return mode ? mode.label : '';
    };

    const renderFontSizeModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={fontSizeModalVisible}
            onRequestClose={() => setFontSizeModalVisible(false)}
            statusBarTranslucent={true}
        >
            <TouchableOpacity
                style={{flex: 1}}
                activeOpacity={1}
                onPress={() => setFontSizeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, {backgroundColor: getTheme(isDarkMode).backgroundColor}]}>
                        <View style={styles.modalHeader}>
                            <Text
                                style={[styles.modalTitle, {color: getTheme(isDarkMode).textColor}]}>选择字体大小</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setFontSizeModalVisible(false)}
                            >
                                <Icon name="close-outline" type="ionicon" size={24}
                                      color={getTheme(isDarkMode).textColor}/>
                            </TouchableOpacity>
                        </View>
                        {fontSizes.map((size) => (
                            <TouchableOpacity
                                key={size}
                                style={[styles.fontSizeOption, {borderBottomColor: getTheme(isDarkMode).borderColor}]}
                                onPress={() => handleFontSizeChange(size)}
                            >
                                <Text
                                    style={[styles.fontSizeText, {color: getTheme(isDarkMode).textColor}]}>{size}</Text>
                                {selectedFontSize === size && (
                                    <Icon name="checkmark-outline" type="ionicon" size={20}
                                          color={getTheme(isDarkMode).textColor}/>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderDarkModeModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={darkModeModalVisible}
            onRequestClose={() => setDarkModeModalVisible(false)}
            statusBarTranslucent={true}
        >
            <TouchableOpacity
                style={{flex: 1}}
                activeOpacity={1}
                onPress={() => setDarkModeModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, {backgroundColor: getTheme(isDarkMode).backgroundColor}]}>
                        <View style={styles.modalHeader}>
                            <Text
                                style={[styles.modalTitle, {color: getTheme(isDarkMode).textColor}]}>选择显示模式</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setDarkModeModalVisible(false)}
                            >
                                <Icon name="close-outline" type="ionicon" size={24}
                                      color={getTheme(isDarkMode).textColor}/>
                            </TouchableOpacity>
                        </View>
                        {darkModes.map((mode) => (
                            <TouchableOpacity
                                key={mode.value}
                                style={[styles.fontSizeOption, {borderBottomColor: getTheme(isDarkMode).borderColor}]}
                                onPress={() => handleDarkModeChange(mode.value)}
                            >
                                <Text
                                    style={[styles.fontSizeText, {color: getTheme(isDarkMode).textColor}]}>{mode.label}</Text>
                                {darkMode === mode.value && (
                                    <Icon name="checkmark-outline" type="ionicon" size={20}
                                          color={getTheme(isDarkMode).textColor}/>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return <SafeAreaView style={[styles.container, {backgroundColor: getTheme(isDarkMode).backgroundColor}]}>
        <ScrollView>
            <View style={styles.profileWrapper}>
                <Image style={styles.avatar}
                       source={{uri: 'https://kuoyio.cn/_next/image?url=https%3A%2F%2Fkuoyio-image.oss-cn-shenzhen.aliyuncs.com%2Favatar%2F20240222155915.webp&w=128&q=75'}}/>
                <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, {color: getTheme(isDarkMode).textColor}]}>zchengb</Text>
                    <Text
                        style={[styles.profileDesc, {color: getTheme(isDarkMode).secondaryTextColor}]}>zxchengb@163.com</Text>
                </View>
                <TouchableOpacity
                    style={[styles.logoutButton, {backgroundColor: getTheme(isDarkMode).cardBackgroundColor}]}>
                    <Icon
                        name="log-out-outline"
                        type="ionicon"
                        size={24}
                        color={getTheme(isDarkMode).textColor}
                    />
                </TouchableOpacity>
            </View>

            <View
                style={[styles.settingList, styles.firstGroup, {backgroundColor: getTheme(isDarkMode).cardBackgroundColor}]}>
                <TouchableOpacity style={[styles.settingItem, {borderBottomColor: getTheme(isDarkMode).borderColor}]}>
                    <View style={styles.settingLeft}>
                        <Icon name="sync-outline" type="ionicon" size={20} color={getTheme(isDarkMode).textColor}/>
                        <Text style={[styles.settingText, {color: getTheme(isDarkMode).textColor}]}>同步管理</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20}
                          color={getTheme(isDarkMode).secondaryTextColor}/>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.settingItem, {borderBottomColor: getTheme(isDarkMode).borderColor}]}
                    onPress={() => setFontSizeModalVisible(true)}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="text-outline" type="ionicon" size={20} color={getTheme(isDarkMode).textColor}/>
                        <Text style={[styles.settingText, {color: getTheme(isDarkMode).textColor}]}>字体大小</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text
                            style={[styles.settingValue, {color: getTheme(isDarkMode).secondaryTextColor}]}>{selectedFontSize}</Text>
                        <Icon name="chevron-forward-outline" type="ionicon" size={20}
                              color={getTheme(isDarkMode).secondaryTextColor}/>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, {borderBottomColor: getTheme(isDarkMode).borderColor}]}
                                  onPress={() => setDarkModeModalVisible(true)}>
                    <View style={styles.settingLeft}>
                        <Icon name={isDarkMode ? "moon" : "moon-outline"} type="ionicon" size={20}
                              color={getTheme(isDarkMode).textColor}/>
                        <Text style={[styles.settingText, {color: getTheme(isDarkMode).textColor}]}>深色模式</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text
                            style={[styles.settingValue, {color: getTheme(isDarkMode).secondaryTextColor}]}>{getDarkModeText()}</Text>
                        <Icon name="chevron-forward-outline" type="ionicon" size={20}
                              color={getTheme(isDarkMode).secondaryTextColor}/>
                    </View>
                </TouchableOpacity>
            </View>

            <View
                style={[styles.settingList, styles.secondGroup, {backgroundColor: getTheme(isDarkMode).cardBackgroundColor}]}>
                <TouchableOpacity style={[styles.settingItem, {borderBottomColor: getTheme(isDarkMode).borderColor}]}>
                    <View style={styles.settingLeft}>
                        <Icon name="chatbox-outline" type="ionicon" size={20} color={getTheme(isDarkMode).textColor}/>
                        <Text style={[styles.settingText, {color: getTheme(isDarkMode).textColor}]}>意见反馈</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20}
                          color={getTheme(isDarkMode).secondaryTextColor}/>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.settingItem, {borderBottomColor: getTheme(isDarkMode).borderColor}]}>
                    <View style={styles.settingLeft}>
                        <Icon name="information-circle-outline" type="ionicon" size={20}
                              color={getTheme(isDarkMode).textColor}/>
                        <Text style={[styles.settingText, {color: getTheme(isDarkMode).textColor}]}>关于</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20}
                          color={getTheme(isDarkMode).secondaryTextColor}/>
                </TouchableOpacity>
            </View>
        </ScrollView>

        {renderFontSizeModal()}
        {renderDarkModeModal()}
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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