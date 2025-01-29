import React, {useState} from 'react';
import {Alert, StyleSheet, Switch, TouchableOpacity, View} from 'react-native';
import Modal from 'react-native-modal';
import {Icon, useTheme} from '@rneui/themed';
import {Text} from "./Text";
import {logEvent} from "../analytics";
import {storage} from "../storage";
import * as Burnt from "burnt";
import {
    getUserNewsChannelConfig,
    getUserNewsChannelConfigCurrentVersion,
    updateUserNewsChannelConfig
} from "../apis/User";
import useNewsStore from "../stores/useNewsStore";

const SyncModal = ({
                       isVisible,
                       onClose,
                       toLogin,
                   }) => {
    const {theme} = useTheme();
    const [lastSyncTime, setLastSyncTime] = useState(storage.getString('lastSyncTime'));
    const [isSyncEnabled, setIsSyncEnabled] = useState(storage.getBoolean('isSyncEnabled') ?? false);
    const [accessToken, setAccessToken] = useState(storage.getString('accessToken'));
    const [lastSyncClickTime, setLastSyncClickTime] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const fetchDefaultChannels = useNewsStore(state => state.fetchDefaultChannels);

    const showSyncInfo = () => {
        Alert.alert(
            '同步说明',
            '将手机端的资讯频道订阅配置备份到云端，以便在浏览器扩展程序或其他设备中查看和使用',
            [{text: '知道了', style: 'cancel'}]
        );
    };

    const updateChannelConfigVersion = (version) => {
        storage.set('newsChannelConfigVersion', version?.toString() || undefined);
    }

    const updateLastSyncTime = () => {
        const now = new Date().toLocaleString();
        storage.set('lastSyncTime', now);
        setLastSyncTime(now);
    }

    const fetchUserNewsChannelConfig = async () => {
        if (!accessToken) {
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

    const handleSyncToggle = (syncToggleValue) => {
        if (!accessToken) {
            return;
        }
        setIsSyncEnabled(syncToggleValue);
        if (syncToggleValue) {
            fetchUserNewsChannelConfig();
        }
    };

    const promptLoginForSync = () => {
        if (!accessToken) {
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
                        toLogin();
                    }
                }
            ]);
        }
    }

    const handleManualSync = async () => {
        const now = Date.now();
        if (now - lastSyncClickTime < 5000) {
            Burnt.toast({
                title: '操作频繁，请稍后再试',
                preset: 'error',
                duration: 2,
            });
            return;
        }

        if (!accessToken) {
            promptLoginForSync();
            return;
        }

        setIsSyncing(true);
        setLastSyncClickTime(now);

        const channelSettings = JSON.parse(storage.getString('channelList')) || await fetchDefaultChannels();
        try {
            const response = await updateUserNewsChannelConfig(channelSettings);
            const data = await response.json();
            if (response.ok) {
                const {newVersion} = data;
                updateChannelConfigVersion(newVersion);
                updateLastSyncTime();
                Burnt.toast({
                    title: '同步成功',
                    preset: 'done',
                    message: '已将本地配置同步至云端',
                    duration: 2,
                });
            } else {
                throw new Error(data?.message || '同步失败');
            }
        } catch (e) {
            Burnt.toast({
                title: '同步失败',
                preset: 'error',
                message: e.message
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Modal
            isVisible={isVisible}
            style={{margin: 0}}
            backdropOpacity={0.5}
            onBackdropPress={onClose}
            onSwipeComplete={onClose}
            backdropTransitionOutTiming={0}
            swipeDirection="down"
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: theme.colors.background}]}>
                    <View style={styles.modalHeader}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>同步设置</Text>
                            <TouchableOpacity onPress={showSyncInfo} style={styles.infoIcon}>
                                <Icon name="help-circle-outline" type="ionicon" size={20}
                                      color={theme.colors.secondaryText}/>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Icon name="close-outline" type="ionicon" size={24}
                                  color={theme.colors.text}/>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.settingItem, {borderBottomColor: theme.colors.border, paddingVertical: 12}]}
                        onPress={() => promptLoginForSync()}
                    >
                        <View style={styles.settingLeft}>
                            <Icon name="sync-outline" type="ionicon" size={20} color={theme.colors.text}/>
                            <Text style={[styles.settingText, {color: theme.colors.text}]}>与其他设备同步</Text>
                        </View>
                        <Switch
                            value={isSyncEnabled}
                            onValueChange={handleSyncToggle}
                            trackColor={{false: theme.colors.border, true: theme.colors.indicator}}
                            style={{transform: [{scale: 0.8}], opacity: accessToken ? 1 : 0.3}}
                            disabled={!accessToken}
                        />
                    </TouchableOpacity>
                    <View
                        style={[styles.settingItem, {
                            borderBottomColor: theme.colors.border,
                            paddingVertical: 12,
                            marginBottom: !lastSyncTime ? 56 : 0
                        }]}
                    >
                        <View style={styles.settingLeft}>
                            <Icon name="cloud-upload-outline" type="ionicon" size={20} color={theme.colors.text}/>
                            <Text style={[styles.settingText, {color: theme.colors.text}]}>同步数据到云端</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleManualSync}
                            disabled={!accessToken || isSyncing}
                        >
                            <Text
                                style={[styles.actionText, {
                                    color: theme.colors.primary,
                                    opacity: (accessToken && !isSyncing) ? 1 : 0.3
                                }]}
                            >
                                {isSyncing ? '同步中...' : '立即同步'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {lastSyncTime && (
                        <Text style={[styles.lastSyncTime, {color: theme.colors.secondaryText}]}>
                            上次同步时间: {lastSyncTime}
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    lastSyncTime: {
        fontSize: 14,
        marginLeft: 32,
        marginTop: 12,
        marginBottom: 24,
    },
    infoIcon: {
        marginLeft: 4,
        padding: 4
    }
});

export default SyncModal;