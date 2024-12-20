import React, {useCallback, useState} from "react";
import {
    Alert,
    Image,
    SafeAreaView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import Modal from "react-native-modal";
import {Icon, useTheme} from "@rneui/themed";
import {storage} from "../storage";
import {CHANNEL_COMPONENT_MAP, DEFAULT_CHANNEL_LIST} from "../constant";
import DraggableFlatList, {ScaleDecorator} from 'react-native-draggable-flatlist'
import {trigger} from "react-native-haptic-feedback";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {Text} from "../components/Text";
import {useDarkMode} from "../hooks/DarkModeHooks";
import {useFocusEffect} from '@react-navigation/native';
import {
    getUserNewsChannelConfig,
    getUserNewsChannelConfigCurrentVersion,
    updateUserNewsChannelConfig
} from "../apis/User";

export const SubscribeScreen = () => {
    const [channelList, setChannelList] = useState([]);
    const [rssModalVisible, setRssModalVisible] = useState(false);
    const [rssName, setRssName] = useState('');
    const [rssLink, setRssLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingChannel, setEditingChannel] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();

    const loadChannelList = async () => {
        const syncEnabled = storage.getBoolean('isSyncEnabled') || false;
        const accessToken = storage.getString('accessToken');
        
        if (syncEnabled && accessToken) {
            const localVersion = storage.getString('newsChannelConfigVersion');
            try {
                getUserNewsChannelConfigCurrentVersion().then(async response => {
                    if (response.ok) {
                        const data = await response.json();
                        const serverVersion = data.version;
                        if (serverVersion !== undefined && localVersion !== undefined && serverVersion > localVersion) {
                            getUserNewsChannelConfig().then(async response => {
                                const data = await response.json();
                                const serverChannelList = JSON.parse(data.content);
                                const version = data.version;
                                const processedList = injectChannelComponentFields(serverChannelList || DEFAULT_CHANNEL_LIST);
                                setChannelList(processedList);
                                saveChannelListToStorage(serverChannelList);
                                storage.set('newsChannelConfigVersion', version?.toString());
                            });
                        } else {
                            loadLocalChannelList();
                        }
                    } else {
                        loadLocalChannelList();
                    }
                });
            } catch (error) {
                console.error('Error loading channel list from server:', error);
                loadLocalChannelList();
            }
        } else {
            loadLocalChannelList();
        }
    };

    const loadLocalChannelList = () => {
        const stringifyChannelList = storage.getString('channelList');
        console.log('stringifyChannelList:', stringifyChannelList, 'loadLocalChannelList');
        if (stringifyChannelList) {
            setChannelList(injectChannelComponentFields(JSON.parse(stringifyChannelList) || DEFAULT_CHANNEL_LIST));
        } else {
            setChannelList(injectChannelComponentFields(DEFAULT_CHANNEL_LIST));
            saveChannelListToStorage(DEFAULT_CHANNEL_LIST);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadChannelList();
        }, [])
    );

    const injectChannelComponentFields = (channelList) => {
        return channelList.filter(channel => CHANNEL_COMPONENT_MAP[channel.id] || channel.isRss)
            .map((channel, index) => (
                {
                    ...channel,
                    renderIcon: CHANNEL_COMPONENT_MAP[channel.id]?.renderIcon
                }
            ));
    }

    const reorderChannelList = (newChannelList) => {
        setChannelList(newChannelList);
        const pureChannelList = newChannelList.map((channel) => {
            const pureChannel = {...channel};
            delete pureChannel.renderIcon;
            return pureChannel;
        });
        saveChannelListToStorage(pureChannelList, true);
    }

    const saveChannelListToStorage = async (newChannelList, needSync = false) => {
        const syncEnabled = storage.getBoolean('isSyncEnabled') || false;
        
        if (syncEnabled && needSync) {
            updateUserNewsChannelConfig(newChannelList).then(async response => {
                if (response.ok) {
                    const data = await response.json();
                    storage.set('newsChannelConfigVersion', data.newVersion?.toString());
                    storage.set('lastSyncTime', new Date().toLocaleString());
                } else {
                    console.error('failed to update channel list to server');
                }
            }).catch(error => {
                console.error('failed to update channel list to server', error);
            });
        }

        storage.set('channelList', JSON.stringify(newChannelList));
        console.log('successfully update channel list');
    }

    const handleSubscribe = (channel) => {
        const subscribedChannels = channelList.filter(item => item.enable);

        if (channel.enable && subscribedChannels.length === 1) {
            Alert.alert(
                "提示",
                "请至少保留一个资讯订阅 😃",
                [{text: "确定"}]
            );
            return;
        }

        const newChannelList = [...channelList];

        newChannelList.forEach(item => {
            if (item.id === channel.id) {
                item.enable = !item.enable;
            }
        })

        setChannelList(newChannelList);
        saveChannelListToStorage(newChannelList, true);
    }

    const saveRssResource = async (rssUrl) => {
        const response = await fetch(apiUrl + '/rss-resource', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rssUrl: rssUrl
            })
        });
        const data = await response.json();
        return {response, data};
    }

    const handleEditRss = async () => {
        if (!validRssName() || !validRssLink()) {
            return;
        }

        try {
            setLoading(true);
            const {response, data} = await saveRssResource(rssLink);

            if (response.status === 200) {
                const newChannelList = channelList.map(channel => {
                    if (channel.id === editingChannel.id) {
                        return {
                            ...channel,
                            title: rssName,
                            tabTitle: rssName,
                            desc: data.description,
                            iconUrl: data.iconUrl,
                            rssUrl: rssLink,
                        };
                    }
                    return channel;
                });

                setChannelList(newChannelList);
                saveChannelListToStorage(newChannelList, true);

                closeRssInfoModal();
                setRssName('');
                setRssLink('');
                setEditingChannel(null);
                setIsEditMode(false);
            } else {
                Alert.alert(
                    "修改失败",
                    data.message,
                    [{text: "确定"}]
                );
            }
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteRss = () => {
        Alert.alert(
            "删除RSS订阅",
            "确定要删除该RSS订阅吗？",
            [
                {
                    text: "取消",
                    style: "cancel"
                },
                {
                    text: "删除",
                    style: "destructive",
                    onPress: () => {
                        const newChannelList = channelList.filter(channel => channel.id !== editingChannel.id);
                        setChannelList(newChannelList);
                        saveChannelListToStorage(newChannelList, true);
                        closeRssInfoModal();
                    }
                }
            ]
        );
    }

    const handleRssItemClick = (item) => {
        setIsEditMode(true);
        setEditingChannel(item);
        setRssName(item.title);
        setRssLink(item.rssUrl);
        setRssModalVisible(true);
    }

    const generateUUID = () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    const validRssLink = () => {
        const urlPattern = /^https?:\/\/.*$/;
        if (!urlPattern.test(rssLink)) {
            Alert.alert(
                "添加失败",
                "请输入有效的RSS链接",
                [{text: "确定"}]
            );
            return false;
        }
        return true;
    }

    const validRssName = () => {
        if (rssName && rssName.length > 24) {
            Alert.alert(
                "添加失败",
                "RSS名称不能超过24个字符",
                [{text: "确定"}]
            );
            return false;
        }
        return true;
    }

    const handleAddRss = async () => {
        if (!validRssName() || !validRssLink()) {
            return;
        }

        try {
            setLoading(true);
            const {response, data} = await saveRssResource(rssLink);

            console.log('handle add rss link:', data);

            if (response.status === 200) {
                const newChannelList = [...channelList];

                newChannelList.unshift(
                    {
                        id: generateUUID(),
                        title: rssName,
                        tabTitle: rssName,
                        desc: data.description,
                        iconUrl: data.iconUrl,
                        rssUrl: rssLink,
                        enable: true,
                        isRss: true
                    }
                );

                setChannelList(newChannelList);
                saveChannelListToStorage(newChannelList, true);

                closeRssInfoModal();
                setRssName('');
                setRssLink('');
            } else {
                Alert.alert(
                    "添加失败",
                    data.message,
                    [{text: "确定"}]
                );
            }
        } finally {
            setLoading(false);
        }
    }

    const closeRssInfoModal = () => {
        TextInput.State.currentlyFocusedInput() && TextInput.State.blurTextInput(TextInput.State.currentlyFocusedInput());
        setRssModalVisible(false);
        setIsEditMode(false);
        setEditingChannel(null);
        setRssName('');
        setRssLink('');
    }

    const saveButtonDisabled = () => {
        return loading || !rssName || !rssLink;
    }

    const renderItem = useCallback(({item, index, drag, isActive}) => {
        return (
            <ScaleDecorator>
                <TouchableOpacity
                    activeOpacity={0.8}
                    delayLongPress={300}
                    onPress={() => item.isRss ? handleRssItemClick(item) : null}
                    onLongPress={() => {
                        trigger("impactLight", {
                            enableVibrateFallback: true,
                            ignoreAndroidSystemSettings: false,
                        });
                        drag();
                    }}
                    disabled={isActive}
                    style={[styles.channelItem, {backgroundColor: theme.colors.background}]}
                >
                    {
                        item.isRss
                            ?
                            <Image source={{uri: item.iconUrl}} width={24} height={24} style={styles.channelIcon}/>
                            :
                            item.renderIcon(styles.channelIcon, 24, 24)
                    }
                    <View style={styles.channelInfoWrapper}>
                        <View style={styles.channelInfoRow}>
                            <View style={styles.channelTextInfoWrapper}>
                                <View style={styles.channelTitleRow}>
                                    <Text style={[styles.channelTitle, {color: theme.colors.text}]}>{item.title}</Text>
                                    {item.isRss ? <Icon type={'ionicon'} name={'logo-rss'} color={'#f7a35e'} size={14}
                                                        style={styles.rssTag}/> : <></>}
                                </View>
                                {item.isRss && !item.desc ? <></> :
                                    <Text style={[styles.channelDesc, {color: theme.colors.secondaryText}]}
                                          numberOfLines={1}>{item.desc}</Text>}
                            </View>
                            <TouchableOpacity
                                style={[styles.subscribeButton, {borderColor: item.enable ? '#B6B6B6' : theme.colors.primary}]}
                                onPress={() => handleSubscribe(item)}
                            >
                                <Text
                                    style={[styles.subscribeButtonLabel, {color: item.enable ? theme.colors.secondaryText : theme.colors.primary}]}>{item.enable ? '已订阅' : '+ 订阅'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.channelItemDivider, {backgroundColor: theme.colors.border}]}/>
                    </View>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    }, [channelList, theme])

    const renderRssModal = () => {
        return (
            <Modal
                isVisible={rssModalVisible}
                swipeDirection="down"
                onBackdropPress={closeRssInfoModal}
                onSwipeComplete={closeRssInfoModal}
                style={styles.rssModal}
                backdropTransitionOutTiming={0}
            >
                <TouchableOpacity style={styles.rssModalContainer} onPress={closeRssInfoModal} activeOpacity={1}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.rssModalContent, {backgroundColor: theme.colors.modalBackground}]}>
                            <View style={styles.rssModalOperationBar}>
                                <TouchableOpacity style={styles.rssModalButton} onPress={closeRssInfoModal}>
                                    <Text
                                        style={[styles.rssModalCancelLabel, {color: loading ? 'rgba(0,0,0,0.25)' : theme.colors.primary}]}>
                                        取消
                                    </Text>
                                </TouchableOpacity>
                                <Text
                                    style={[styles.rssModalTitle, {color: theme.colors.text}]}>{isEditMode ? '编辑RSS订阅' : '添加RSS订阅'}</Text>
                                <TouchableOpacity style={styles.rssModalButton} disabled={saveButtonDisabled()}
                                                  onPress={isEditMode ? handleEditRss : handleAddRss}
                                >
                                    <Text style={
                                        [
                                            styles.rssModalSaveLabel,
                                            {
                                                color: saveButtonDisabled() ? (theme.isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)') : theme.colors.primary,
                                            }
                                        ]
                                    }>
                                        保存
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.rssModalInputItem}>
                                <Text style={[styles.rssModalInputLabel, {color: theme.colors.text}]}>资讯名称：</Text>
                                <View style={styles.rssModalInputWrapper}>
                                    <TextInput
                                        style={[styles.rssModalInput, styles.rssModalNameInput, {
                                            backgroundColor: theme.colors.inputBackground,
                                            color: theme.colors.text,
                                            borderColor: theme.colors.border,
                                            borderWidth: isDarkMode ? 1 : 0
                                        }]}
                                        placeholder="资讯名称"
                                        placeholderTextColor={theme.colors.secondaryText}
                                        value={rssName}
                                        onChangeText={setRssName}
                                        maxLength={24}
                                        autoFocus={true}
                                    />
                                    <Text
                                        style={[styles.rssModalInputLimit, {color: theme.colors.secondaryText}]}>{rssName.length}/24</Text>
                                </View>
                            </View>

                            <View style={styles.rssModalInputItem}>
                                <Text style={[styles.rssModalInputLabel, {color: theme.colors.text}]}>RSS链接：</Text>
                                <TextInput
                                    style={[styles.rssModalInput, {
                                        backgroundColor: theme.colors.inputBackground,
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border,
                                        borderWidth: isDarkMode ? 1 : 0
                                    }]}
                                    placeholder="RSS链接"
                                    placeholderTextColor={theme.colors.secondaryText}
                                    value={rssLink}
                                    onChangeText={setRssLink}
                                />
                            </View>

                            <Text style={[styles.rssModalTips, {color: theme.colors.secondaryText}]}>
                                💡使用浏览器搜索关键字 '网站名 + RSS'，找到网站对应的RSS链接，或者使用RSSHub直接获取相关链接
                            </Text>

                            {isEditMode && (
                                <TouchableOpacity
                                    style={[styles.rssModalDeleteButton, {backgroundColor: theme.colors.inputBackground}]}
                                    onPress={handleDeleteRss}
                                >
                                    <Text style={styles.rssModalDeleteLabel}>删除此订阅</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        );
    }

    return <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.topBar}>
            <Text style={[styles.pageTitle, {color: theme.colors.text}]}>资讯订阅</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setRssModalVisible(true)}>
                <Icon
                    size={16}
                    name='add-outline'
                    type='ionicon'
                    color={theme.colors.primary}
                />
                <Text style={[styles.addButtonLabel, {color: theme.colors.primary}]}>
                    添加RSS频道
                </Text>
            </TouchableOpacity>
        </View>
        <View style={styles.channelContainer}>
            <Text style={[styles.dragTips, {color: theme.colors.secondaryText}]}>Tips: 长按即可进行拖拽排序</Text>
            <GestureHandlerRootView style={styles.gestureContainer}>
                <DraggableFlatList
                    containerStyle={styles.dragContainer}
                    data={channelList}
                    onDragEnd={({data}) => reorderChannelList(data)}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                />
            </GestureHandlerRootView>
        </View>

        {renderRssModal()}
    </SafeAreaView>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        marginTop: 12,
        flexDirection: 'row',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dragTips: {
        marginLeft: 20,
        marginBottom: 8,
        fontSize: 12,
        textAlign: 'left'
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: "bold"
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    addButtonLabel: {
        fontSize: 16,
        marginLeft: 2
    },
    channelContainer: {
        marginBottom: 48,
        marginTop: 12,
        flex: 1,
    },
    gestureContainer: {
        flex: 1
    },
    dragContainer: {
        flex: 1,
    },
    channelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 0,
        position: 'relative',
    },
    channelIcon: {
        marginLeft: 2,
        marginRight: 16,
        position: 'absolute',
        top: '24%',
        left: 18,
    },
    channelInfoWrapper: {
        flex: 1,
        paddingVertical: 6,
        marginLeft: 40,
        justifyContent: 'center',
        position: 'relative',
    },
    channelInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    channelTextInfoWrapper: {
        justifyContent: 'center',
        flex: 1,
    },
    channelTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    channelTitle: {
        fontSize: 16,
        fontWeight: '500'
    },
    rssTag: {
        marginLeft: 8
    },
    channelDesc: {
        marginTop: 8,
        fontSize: 12,
    },
    channelItemDivider: {
        marginTop: 10,
        width: '100%',
        height: 0.8,
    },
    gotoDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subscribeStatusText: {
        fontSize: 13,
        marginRight: 8,
    },
    subscribeButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 24,
        borderWidth: 0.5,
    },
    subscribeButtonLabel: {
        fontSize: 12,
    },
    rssModal: {
        margin: 0,
        borderRadius: 10,
    },
    rssModalContainer: {
        flex: 1,
    },
    rssModalContent: {
        flex: 1,
        marginTop: 56,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    rssModalOperationBar: {
        flexDirection: 'row',
        marginTop: 4,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 48,
    },
    rssModalButton: {},
    rssModalSaveLabel: {
        fontSize: 18,
        fontWeight: "500"
    },
    rssModalCancelLabel: {
        fontSize: 18,
    },
    rssModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    rssModalInputItem: {
        marginBottom: 28,
    },
    rssModalInputLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 12,
    },
    rssModalInput: {
        height: 44,
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    rssModalInputWrapper: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center'
    },
    rssModalNameInput: {
        flex: 1,
        paddingRight: 56
    },
    rssModalInputLimit: {
        position: 'absolute',
        right: 12
    },
    rssModalTips: {
        fontSize: 14,
        lineHeight: 20
    },
    rssModalDeleteButton: {
        marginTop: 40,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    rssModalDeleteLabel: {
        fontSize: 16,
        color: '#FF3B30',
    }
});

export default SubscribeScreen;