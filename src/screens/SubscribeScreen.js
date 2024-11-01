import React, {useCallback, useEffect, useState} from "react";
import {
    Alert,
    Image,
    SafeAreaView,
    StyleSheet, Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import ModalComponent from "react-native-modal";
import {Icon} from "@rneui/themed";
import {storage} from "../storage";
import {CHANNEL_COMPONENT_MAP, DEFAULT_CHANNEL_LIST} from "../constant";
import DraggableFlatList, {ScaleDecorator} from 'react-native-draggable-flatlist'
import {trigger} from "react-native-haptic-feedback";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {API_URL} from '@env';

export const SubscribeScreen = () => {
    const [channelList, setChannelList] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [rssName, setRssName] = useState('');
    const [rssLink, setRssLink] = useState('');
    const [rssChannelEnabled, setRssChannelEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [editingChannel, setEditingChannel] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        const stringifyChannelList = storage.getString('channelList')

        if (stringifyChannelList) {
            setChannelList(injectChannelComponentFields(JSON.parse(stringifyChannelList) || DEFAULT_CHANNEL_LIST));
        } else {
            setChannelList(injectChannelComponentFields(DEFAULT_CHANNEL_LIST))
            saveChannelListToStorage(DEFAULT_CHANNEL_LIST);
        }
    }, []);

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
        saveChannelListToStorage(pureChannelList);
    }

    const saveChannelListToStorage = (newChannelList) => {
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
        saveChannelListToStorage(newChannelList);
    }

    const saveRssResource = async (rssUrl) => {
        const response = await fetch(API_URL + '/rss-resource', {
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
                            iconUrl: data.iconUrl,
                            rssUrl: rssLink,
                            enable: rssChannelEnabled
                        };
                    }
                    return channel;
                });

                setChannelList(newChannelList);
                saveChannelListToStorage(newChannelList);

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

    const handleRssItemClick = (item) => {
        setIsEditMode(true);
        setEditingChannel(item);
        setRssName(item.title);
        setRssLink(item.rssUrl);
        setRssChannelEnabled(item.enable);
        setModalVisible(true);
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
                        iconUrl: data.iconUrl,
                        rssUrl: rssLink,
                        enable: true,
                        isRss: true
                    }
                );

                setChannelList(newChannelList);
                saveChannelListToStorage(newChannelList);

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
        setModalVisible(false);
        setIsEditMode(false);
        setEditingChannel(null);
        setRssName('');
        setRssLink('');
        setRssChannelEnabled(true);
    }

    const saveButtonDisabled = () => {
        return loading || !rssName || !rssLink;
    }

    const toggleSwitchRssChannelEnabled = () => {
        setRssChannelEnabled(!rssChannelEnabled);
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
                    style={[
                        styles.channelItem
                    ]}
                >
                    {
                        item.isRss
                            ?
                            <Image source={{uri: item.iconUrl}} width={20} height={20} style={styles.channelIcon}/>
                            :
                            item.renderIcon(styles.channelIcon, 20, 20)
                    }
                    <View style={styles.channelInfoWrapper}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <View style={styles.channelTextInfoWrapper}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={styles.channelTitle}>{item.title}</Text>
                                    {item.isRss ? <Text style={styles.rssTagText}>RSS</Text> : <></>}
                                </View>
                                {item.isRss ? <></> :
                                    <Text style={styles.channelDesc} numberOfLines={1}>{item.desc}</Text>}
                            </View>
                            {
                                false && item.isRss
                                    ?
                                    <View
                                        style={styles.gotoDetailButton}
                                    >
                                        <Text
                                            style={styles.subscribeStatusText}>{item.enable ? '已订阅' : '未订阅'}</Text>
                                        <Icon type={'ionicon'} name={'chevron-forward-outline'} color={'#464646'}
                                              size={16}></Icon>
                                    </View>
                                    :
                                    <TouchableOpacity
                                        style={[styles.subscribeButton, {borderColor: item.enable ? '#B6B6B6' : '#F76F00'}]}
                                        onPress={() => handleSubscribe(item)}
                                    >
                                        <Text
                                            style={[styles.subscribeButtonLabel, {color: item.enable ? '#939393' : '#F76F00'}]}>{item.enable ? '已订阅' : '+ 订阅'}</Text>
                                    </TouchableOpacity>
                            }
                        </View>
                    </View>
                    <View style={styles.channelItemDivider}/>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    }, [channelList])

    return <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
            <Text style={styles.pageTitle}>资讯订阅</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Icon
                    size={16}
                    name='add-outline'
                    type='ionicon'
                    color='#F76F00'
                />
                <Text style={styles.addButtonLabel}>
                    添加RSS频道
                </Text>
            </TouchableOpacity>
        </View>
        <View style={styles.channelContainer}>
            <Text style={styles.dragTips}>Tips: 长按即可进行拖拽排序</Text>
            <GestureHandlerRootView style={{flex: 1}}>
                <DraggableFlatList
                    containerStyle={styles.dragContainer}
                    data={channelList}
                    onDragEnd={({data}) => reorderChannelList(data)}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                />
            </GestureHandlerRootView>
        </View>

        <ModalComponent
            isVisible={modalVisible}
            swipeDirection="down"
            onBackdropPress={closeRssInfoModal}
            onSwipeComplete={closeRssInfoModal}
            style={styles.bottomModal}
        >
            <TouchableOpacity style={styles.modalContainer} onPress={closeRssInfoModal} activeOpacity={1}>
                <TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                        <View style={styles.operationBar}>
                            <TouchableOpacity style={[styles.button]} onPress={closeRssInfoModal}>
                                <Text
                                    style={[styles.cancelButtonLabel, {color: loading ? 'rgba(0,0,0,0.25)' : '#F76F00'}]}>
                                    取消
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>{isEditMode ? '编辑RSS订阅' : '添加RSS订阅'}</Text>
                            <TouchableOpacity style={styles.button} disabled={saveButtonDisabled()}
                                              onPress={isEditMode ? handleEditRss : handleAddRss}
                            >
                                <Text style={
                                    [
                                        styles.saveButtonLabel,
                                        {
                                            color: saveButtonDisabled() ? 'rgba(0,0,0,0.25)' : '#F76F00',
                                        }
                                    ]
                                }>
                                    保存
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputItemWrapper}>
                            <Text style={styles.inputLabel}>资讯名称：</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={[styles.input, styles.rssNameInput]}
                                    placeholder="资讯名称"
                                    value={rssName}
                                    onChangeText={setRssName}
                                    maxLength={24}
                                    autoFocus={true}
                                />
                                <Text style={styles.inputLimitTips}>{rssName.length}/24</Text>
                            </View>
                        </View>

                        <View style={styles.inputItemWrapper}>
                            <Text style={styles.inputLabel}>RSS链接：</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="RSS链接"
                                value={rssLink}
                                onChangeText={setRssLink}
                            />
                        </View>

                        <View style={styles.checkItemWrapper}>
                            <Text style={styles.checkLabel}>订阅频道：</Text>
                            <Switch
                                trackColor={{false: '#D9D9D9', true: '#686767'}}
                                onValueChange={toggleSwitchRssChannelEnabled}
                                style={styles.switchBox}
                                value={rssChannelEnabled}
                            />
                        </View>

                        <Text style={styles.tips}>
                            💡使用浏览器搜索关键字 '网站名 + RSS'，找到网站对应的RSS链接，或者使用RSSHub直接获取相关链接
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </ModalComponent>
    </SafeAreaView>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topBar: {
        marginTop: 12,
        flexDirection: 'row',
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dragTips: {marginLeft: 20, marginBottom: 8, color: '#939393', fontSize: 12, textAlign: 'left'},
    pageTitle: {
        fontSize: 20,
        fontWeight: "bold"
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    addButtonLabel: {
        color: '#F76F00',
        fontSize: 16,
        marginLeft: 2
    },
    channelContainer: {
        marginBottom: 48,
        marginTop: 12,
        flex: 1,
    },
    dragContainer: {
        flex: 1,
    },
    channelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 6,
        minHeight: 64,
    },
    channelIcon: {
        marginLeft: 2,
        marginRight: 16,
    },
    channelInfoWrapper: {
        flex: 1,
        paddingVertical: 6,
        justifyContent: 'center',
        position: 'relative',
    },
    channelTextInfoWrapper: {
        justifyContent: 'center',
        flex: 1,
    },
    channelTitle: {
        fontSize: 16,
        fontWeight: '500'
    },
    rssTagText: {
        fontSize: 12,
        marginLeft: 6,
        fontStyle: 'italic',
        color: '#939393'
    },
    channelDesc: {
        marginTop: 8,
        fontSize: 12,
        color: '#939393'
    },
    channelItemDivider: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 0.5,
        backgroundColor: '#B6B6B6',
    },
    gotoDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subscribeStatusText: {
        color: '#939393',
        fontSize: 13,
        marginRight: 8,
    },
    subscribeButton: {
        width: 54,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
        paddingVertical: 6,
        borderRadius: 24,
        borderWidth: 0.4,
    },
    subscribeButtonLabel: {
        fontSize: 12,
    },
    bottomModal: {
        margin: 0,
        borderRadius: 10,
    },
    modalContainer: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        flex: 1,
        marginTop: 56,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    operationBar: {
        flexDirection: 'row',
        marginTop: 4,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 48,
    },
    button: {},
    saveButtonLabel: {
        fontSize: 18,
        color: '#F76F00',
        fontWeight: "500"
    },
    cancelButtonLabel: {
        fontSize: 18,
        color: '#F76F00',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#464646',
    },
    inputItemWrapper: {
        marginBottom: 28,
    },
    checkItemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    checkLabel: {
        color: '#606266',
        fontSize: 16,
        fontWeight: '500',
    },
    switchBox: {
        transform: [
            {scaleX: 0.75},
            {scaleY: 0.75}
        ]
    },
    inputLabel: {
        color: '#606266',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 12,
    },
    input: {
        height: 44,
        borderRadius: 10,
        paddingHorizontal: 16,
        backgroundColor: '#F7F7F7',
        color: '#464646',
        fontSize: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center'
    },
    rssNameInput: {
        flex: 1,
        paddingRight: 56
    },
    inputLimitTips: {
        color: '#939393',
        position: 'absolute',
        right: 12
    },
    tips: {
        fontSize: 14,
        color: '#939393',
        lineHeight: 20
    }
});

export default SubscribeScreen;