import React, {useCallback, useEffect, useState} from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import Modal from "react-native-modal";
import {Icon, useTheme} from "@rneui/themed";
import {storage} from "../storage";
import {getChannelComponent, sanitizeChannelsForApp} from "../constant";
import DraggableFlatList, {ScaleDecorator} from 'react-native-draggable-flatlist'
import {trigger} from "react-native-haptic-feedback";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {Text} from "../components/Text";
import {useDarkMode} from "../hooks/DarkModeHooks";
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {
    getUserNewsChannelConfig,
    getUserNewsChannelConfigCurrentVersion,
    updateUserNewsChannelConfig
} from "../apis/User";
import {logEvent} from "../analytics";
import {SvgUri} from "react-native-svg";
import {debounce} from 'lodash';
import {getRssRecommendations, getRssResourceTitle, saveRssResource} from "../apis/News";
import {useTopInset} from '../hooks/useTopInset';
import useNewsStore from '../stores/useNewsStore';
import {useTab} from '../hooks/TabHooks';

export const SubscribeScreen = () => {
    const [channelList, setChannelList] = useState(null);
    const [rssModalVisible, setRssModalVisible] = useState(false);
    const [rssName, setRssName] = useState('');
    const [rssLink, setRssLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingChannel, setEditingChannel] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [rssRecommendations, setRssRecommendations] = useState([]);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [brokenRecommendationIcons, setBrokenRecommendationIcons] = useState({});
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();
    const isFocused = useIsFocused();
    const topInset = useTopInset();
    const fetchDefaultChannels = useNewsStore(state => state.fetchDefaultChannels);
    const fetchRssNews = useNewsStore(state => state.fetchRssNews);
    const {setTabIndex} = useTab();

    useEffect(() => {
        logEvent('screen_view', {
            screen_name: 'SubscribeScreen',
            page_title: 'SubscribeScreen'
        });
    }, [isFocused]);

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
                                const processedList = injectChannelComponentFields(serverChannelList || await fetchDefaultChannels());
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

    const loadRssRecommendations = async () => {
        setRecommendationLoading(true);
        try {
            const response = await getRssRecommendations();
            const data = await response.json();
            if (response.ok) {
                setRssRecommendations(data || []);
            }
        } catch (error) {
            console.error('Error loading RSS recommendations:', error);
        } finally {
            setRecommendationLoading(false);
        }
    };

    const alignChannelList = (currentChannelList, latestChannelList) => {
        const latestChannelMap = new Map(latestChannelList.map(item => [item.id, item]));
        
        return currentChannelList.map(channel => {
            if (channel.isRss) {
                return channel;
            }
            
            const latestChannel = latestChannelMap.get(channel.id);
            if (!latestChannel) {
                return {
                    ...channel,
                    enable: false
                };
            }
            
            return channel;
        });
    };

    const loadLocalChannelList = async () => {
        const stringifyChannelList = storage.getString('channelList');
        const defaultChannels = await fetchDefaultChannels();
        
        if (stringifyChannelList) {
            const parsedChannelList = JSON.parse(stringifyChannelList);
            const alignedChannelList = alignChannelList(parsedChannelList, defaultChannels);
            setChannelList(injectChannelComponentFields(alignedChannelList));
            
            if (JSON.stringify(parsedChannelList) !== JSON.stringify(alignedChannelList)) {
                saveChannelListToStorage(alignedChannelList);
            }
        } else {
            setChannelList(injectChannelComponentFields(defaultChannels));
            saveChannelListToStorage(defaultChannels);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadChannelList();
            loadRssRecommendations();
        }, [])
    );

    const injectChannelComponentFields = (channelList) => {
        return sanitizeChannelsForApp(channelList).map((channel) => {
            const mapped = getChannelComponent(channel);
            return {
                ...channel,
                renderIcon: mapped?.renderIcon
            };
        });
    }

    const reorderChannelList = async (newChannelList) => {
        setChannelList(newChannelList);
        const pureChannelList = newChannelList.map((channel) => {
            const pureChannel = {...channel};
            delete pureChannel.renderIcon;
            return pureChannel;
        });
        await logEvent('reorder_channel', {
            channel_count: newChannelList.length
        });
        saveChannelListToStorage(pureChannelList, true);
        setTabIndex(0);
    }

    const debouncedSync = useCallback(
        debounce((newChannelList) => {
            const syncEnabled = storage.getBoolean('isSyncEnabled') || false;
            const accessToken = storage.getString('accessToken');

            if (accessToken && syncEnabled) {
                updateUserNewsChannelConfig(newChannelList).then(async response => {
                    if (response.ok) {
                        const data = await response.json();
                        storage.set('newsChannelConfigVersion', data.newVersion?.toString());
                        storage.set('lastSyncTime', new Date().toLocaleString());
                        console.log('successfully update channel list to server');
                    } else {
                        console.error('failed to update channel list to server');
                    }
                }).catch(error => {
                    console.error('failed to update channel list to server', error);
                });
            }
        }, 5000),
        []
    );

    const saveChannelListToStorage = async (newChannelList, needSync = false) => {
        const syncEnabled = storage.getBoolean('isSyncEnabled') || false;
        const accessToken = storage.getString('accessToken');

        if (accessToken && syncEnabled && needSync) {
            debouncedSync(newChannelList);
        }

        storage.set('channelList', JSON.stringify(newChannelList));
        console.log('successfully update channel list');
    }

    useEffect(() => {
        return () => {
            if (debouncedSync.flush) {
                debouncedSync.flush();
            }
        };
    }, []);

    const handleSubscribe = async (channel) => {
        const subscribedChannels = channelList.filter(item => item.enable);

        if (channel.enable && subscribedChannels.length === 1) {
            Alert.alert(
                "提示",
                "请至少保留一个资讯订阅 😃",
                [{text: "确定"}]
            );
            return;
        }

        const newChannelList = channelList.map(item => {
            if (item.id === channel.id) {
                return {
                    ...item,
                    enable: !channel.enable
                };
            }
            return item;
        });


        await logEvent('toggle_channel_subscription', {
            channel_id: channel.id,
            channel_name: channel.title,
            enabled: !channel.enable
        });

        setChannelList(newChannelList);
        saveChannelListToStorage(newChannelList, true);
    }

    const recommendationIconUrl = (recommendation) => {
        const key = recommendation.rssUrl || recommendation.id;
        return recommendation.iconUrl && !brokenRecommendationIcons[key] ? recommendation.iconUrl : null;
    };

    const markRecommendationIconBroken = (recommendation) => {
        setBrokenRecommendationIcons(current => ({
            ...current,
            [recommendation.rssUrl || recommendation.id]: true
        }));
    };

    const recommendationHost = (recommendation) => {
        try {
            return new URL(recommendation.rssUrl).hostname.replace(/^www\./, '');
        } catch (error) {
            return recommendation.rssUrl;
        }
    };

    const isRecommendationSelected = (recommendation) => rssLink === recommendation.rssUrl;

    const isRecommendationSubscribed = (recommendation) =>
        Boolean(channelList?.some(channel => channel.isRss && channel.rssUrl === recommendation.rssUrl));

    const selectRecommendation = (recommendation) => {
        if (isRecommendationSubscribed(recommendation)) {
            return;
        }
        setRssName(recommendation.title || '');
        setRssLink(recommendation.rssUrl || '');
    };

    const handleEditRss = async () => {
        if (!validRssName() || !validRssLink()) {
            return;
        }

        try {
            setLoading(true);
            const response = await saveRssResource(rssLink);
            const data = await response.json();

            if (response.ok) {
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

                await logEvent('edit_rss_channel', {
                    channel_id: editingChannel.id,
                    channel_name: rssName,
                    rss_url: rssLink
                });

                setChannelList(newChannelList);
                saveChannelListToStorage(newChannelList, true);
                
                fetchRssNews().then(() => console.log('Successfully fetch rss news after editing RSS channel :)'));

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

    const handleDeleteRss = async () => {
        Alert.alert(
            "删除 RSS 订阅",
            "确定要删除该 RSS 订阅吗？",
            [
                {
                    text: "取消",
                    style: "cancel"
                },
                {
                    text: "删除",
                    style: "destructive",
                    onPress: async () => {
                        const newChannelList = channelList.filter(channel => channel.id !== editingChannel.id);
                        await logEvent('delete_rss_channel', {
                            channel_id: editingChannel.id,
                            channel_name: editingChannel.title
                        });
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
                "操作失败",
                "请输入有效的 RSS 链接",
                [{text: "确定"}]
            );
            return false;
        }
        return true;
    }

    const validRssName = () => {
        if (rssName && rssName.length > 24) {
            Alert.alert(
                "操作失败",
                "RSS 名称不能超过 24 个字符",
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
            const selectedRecommendation = rssRecommendations.find(
                recommendation => recommendation.rssUrl === rssLink
            );
            const response = await saveRssResource(rssLink, selectedRecommendation?.id);
            const data = await response.json();
            if (response.ok) {
                const newChannelList = [...channelList];
                const newChannelId = generateUUID();

                newChannelList.unshift(
                    {
                        id: newChannelId,
                        title: rssName,
                        tabTitle: rssName,
                        desc: data.description,
                        iconUrl: data.iconUrl,
                        rssUrl: rssLink,
                        enable: true,
                        isRss: true
                    }
                );

                await logEvent('add_rss_channel', {
                    channel_id: newChannelId,
                    channel_name: rssName,
                    rss_url: rssLink
                });

                setChannelList(newChannelList);
                saveChannelListToStorage(newChannelList, true);
                
                fetchRssNews().then(() => console.log('Successfully fetch rss news after adding RSS channel :)'));

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

    const handleGetRssTitle = async () => {
        if (!validRssLink()) {
            return;
        }

        try {
            setLoading(true);
            const response = await getRssResourceTitle(rssLink);
            const data = await response.json();

            if (response.ok) {
                setRssName(data.title);
            } else {
                Alert.alert(
                    "解析失败",
                    data.message,
                    [{text: "确定"}]
                );
            }
        } catch (error) {
            Alert.alert(
                "解析失败",
                "获取 RSS 标题失败，请手动输入",
                [{text: "确定"}]
            );
        } finally {
            setLoading(false);
        }
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
                        typeof item.renderIcon === 'function'
                            ? item.renderIcon(styles.channelIcon, 24, 24)
                            : item.iconUrl
                                ? (/\.svg(\?|#|$)/i.test(item.iconUrl)
                                    ? <SvgUri width={24} height={24} uri={item.iconUrl} style={styles.channelIcon}/>
                                    : <Image source={{uri: item.iconUrl}} width={24} height={24}
                                             style={styles.channelIcon}/>)
                                : <View style={styles.channelIcon}/>
                    }
                    <View style={styles.channelInfoWrapper}>
                        <View style={styles.channelInfoRow}>
                            <View style={styles.channelTextInfoWrapper}>
                                <View style={styles.channelTitleRow}>
                                    <Text style={[styles.channelTitle, {color: theme.colors.text}]}>{item.title}</Text>
                                    {item.isRss ? <Icon type={'ionicon'} name={'logo-rss'} color={'#f7a35e'} size={14}
                                                        style={styles.rssTag}/> : <></>}
                                </View>
                                <Text style={[styles.channelDesc, {color: theme.colors.secondaryText}]}
                                      numberOfLines={1}>{item.desc || item.title}</Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.subscribeButton,
                                    {borderColor: item.enable ? '#B6B6B6' : theme.colors.primary}
                                ]}
                                onPress={() => handleSubscribe(item)}
                            >
                                <Text
                                    style={[
                                        styles.subscribeButtonLabel,
                                        {color: item.enable ? theme.colors.secondaryText : theme.colors.primary}
                                    ]}
                                >
                                    {item.enable ? '已订阅' : '+ 订阅'}
                                </Text>
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
                                        style={[styles.rssModalCancelLabel, {color: theme.colors.primary}]}>
                                        取消
                                    </Text>
                                </TouchableOpacity>
                                <Text
                                    style={[styles.rssModalTitle, {color: theme.colors.text}]}>{isEditMode ? '编辑 RSS 订阅' : '添加 RSS 订阅'}</Text>
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
                                <Text style={[styles.rssModalInputLabel, {color: theme.colors.text}]}>RSS 链接：</Text>
                                <TextInput
                                    style={[styles.rssModalInput, {
                                        backgroundColor: theme.colors.inputBackground,
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border,
                                        borderWidth: isDarkMode ? 1 : 0
                                    }]}
                                    placeholder="RSS 链接"
                                    placeholderTextColor={theme.colors.secondaryText}
                                    value={rssLink}
                                    onChangeText={setRssLink}
                                    autoFocus={isEditMode}
                                />
                            </View>

                            <View style={styles.rssModalInputItem}>
                                <View style={styles.labelContainer}>
                                    <Text style={[styles.rssModalInputLabel, {marginBottom: 0, color: theme.colors.text}]}>资讯名称：</Text>
                                    <TouchableOpacity
                                        onPress={handleGetRssTitle}
                                        disabled={loading || !rssLink}
                                    >
                                        {loading ? (
                                            <ActivityIndicator size="small" color={theme.colors.primary} />
                                        ) : (
                                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                <Icon
                                                    name="lightbulb-outline"
                                                    size={14}
                                                    color={loading || !rssLink ? theme.colors.secondaryText : theme.colors.primary}
                                                    style={{marginRight: 2}}
                                                />
                                                <Text style={[
                                                    styles.parseText,
                                                    {color: loading || !rssLink ? theme.colors.secondaryText : theme.colors.primary}
                                                ]}>
                                                    尝试解析名称
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={[styles.rssModalInput, {
                                        backgroundColor: theme.colors.inputBackground,
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border,
                                        borderWidth: isDarkMode ? 1 : 0
                                    }]}
                                    placeholder="资讯名称"
                                    placeholderTextColor={theme.colors.secondaryText}
                                    value={rssName}
                                    onChangeText={setRssName}
                                />
                            </View>

                            <Text style={[styles.rssModalTips, {color: theme.colors.secondaryText}]}>
                                💡使用浏览器搜索关键字 '网站名 + RSS'，找到网站对应的 RSS 链接，或者使用 RSSHub 直接获取相关链接
                            </Text>

                            {!isEditMode && (rssRecommendations.length > 0 || recommendationLoading) ? (
                                <View style={[styles.recommendationSection, {backgroundColor: theme.colors.inputBackground}]}>
                                    <View style={styles.recommendationHeader}>
                                        <View style={styles.recommendationHeading}>
                                            <View style={[styles.recommendationHeadingIcon, {backgroundColor: isDarkMode ? '#493426' : '#fff2e8'}]}>
                                                <Icon name="star" type="ionicon" size={14} color={theme.colors.primary}/>
                                            </View>
                                            <View>
                                                <View style={styles.recommendationTitleRow}>
                                                    <Text style={[styles.recommendationTitle, {color: theme.colors.text}]}>推荐 RSS 订阅</Text>
                                                    <Text style={[styles.recommendationCount, {backgroundColor: isDarkMode ? '#493426' : '#fff2e8', color: theme.colors.primary}]}>精选 {rssRecommendations.length}</Text>
                                                </View>
                                                <Text style={[styles.recommendationDescription, {color: theme.colors.secondaryText}]}>点击频道自动填入上方表单</Text>
                                            </View>
                                        </View>
                                        {recommendationLoading ? <ActivityIndicator size="small" color={theme.colors.primary}/> : null}
                                    </View>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.recommendationList}
                                    >
                                        {rssRecommendations.map(recommendation => {
                                            const selected = isRecommendationSelected(recommendation);
                                            const subscribed = isRecommendationSubscribed(recommendation);
                                            const iconUrl = recommendationIconUrl(recommendation);
                                            return (
                                                <TouchableOpacity
                                                    key={recommendation.id || recommendation.rssUrl}
                                                    activeOpacity={0.8}
                                                    disabled={subscribed}
                                                    onPress={() => selectRecommendation(recommendation)}
                                                    style={[styles.recommendationCard, {
                                                        backgroundColor: selected ? (isDarkMode ? '#493426' : '#fffaf6') : theme.colors.background,
                                                        borderColor: selected ? theme.colors.primary : theme.colors.border
                                                    }]}
                                                >
                                                    <View style={styles.recommendationCardHeader}>
                                                        <View style={[styles.recommendationIconFrame, {backgroundColor: isDarkMode ? '#493426' : '#fff2e8'}]}>
                                                            {iconUrl ? (
                                                                /\.svg(\?|#|$)/i.test(iconUrl) ? (
                                                                    <SvgUri
                                                                        width={36}
                                                                        height={36}
                                                                        uri={iconUrl}
                                                                        style={styles.recommendationIcon}
                                                                        onError={() => markRecommendationIconBroken(recommendation)}
                                                                    />
                                                                ) : (
                                                                    <Image
                                                                        source={{uri: iconUrl}}
                                                                        style={styles.recommendationIcon}
                                                                        onError={() => markRecommendationIconBroken(recommendation)}
                                                                    />
                                                                )
                                                            ) : (
                                                                <Icon name="logo-rss" type="ionicon" size={19} color={theme.colors.primary}/>
                                                            )}
                                                        </View>
                                                        <View style={styles.recommendationTitleWrapper}>
                                                            <Text style={[styles.recommendationCardTitle, {color: theme.colors.text}]} numberOfLines={1}>
                                                                {recommendation.title}
                                                            </Text>
                                                            <Text style={[styles.recommendationHost, {color: theme.colors.secondaryText}]} numberOfLines={1}>
                                                                {recommendationHost(recommendation)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text style={[styles.recommendationCardDescription, {color: theme.colors.secondaryText}]} numberOfLines={2}>
                                                        {recommendation.description || '值得订阅的精选内容'}
                                                    </Text>
                                                    <View style={[styles.recommendationButton, {borderColor: subscribed || selected ? theme.colors.primary : theme.colors.border}]}>
                                                        <Text style={[styles.recommendationButtonLabel, {color: subscribed || selected ? theme.colors.primary : theme.colors.secondaryText}]}>
                                                            {subscribed ? '已添加' : selected ? '已选择' : '选择'}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            ) : null}

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

    return <View
        style={[
            styles.container,
            {
                backgroundColor: theme.colors.background,
                paddingTop: topInset
            }
        ]}
    >
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
                    添加 RSS 频道
                </Text>
            </TouchableOpacity>
        </View>
        <View style={styles.channelContainer}>
            {channelList === null ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.indicator}/>
                </View>
            ) : (
                <>
                    <Text style={[styles.dragTips, {color: theme.colors.secondaryText}]}>Tips:
                        长按即可进行拖拽排序</Text>
                    <GestureHandlerRootView style={styles.gestureContainer}>
                        <DraggableFlatList
                            containerStyle={styles.dragContainer}
                            data={channelList}
                            onDragEnd={({data}) => reorderChannelList(data)}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                        />
                    </GestureHandlerRootView>
                </>
            )}
        </View>

        {renderRssModal()}
    </View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
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
    recommendationSection: {
        borderRadius: 16,
        marginHorizontal: 0,
        marginTop: 16,
        overflow: 'hidden',
    },
    recommendationHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 14,
    },
    recommendationHeading: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
    },
    recommendationHeadingIcon: {
        alignItems: 'center',
        backgroundColor: '#fff2e8',
        borderRadius: 10,
        height: 34,
        justifyContent: 'center',
        marginRight: 10,
        width: 34,
    },
    recommendationTitleRow: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    recommendationTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    recommendationCount: {
        backgroundColor: '#fff2e8',
        borderRadius: 10,
        fontSize: 10,
        marginLeft: 7,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    recommendationDescription: {
        fontSize: 11,
        marginTop: 3,
    },
    recommendationList: {
        paddingBottom: 14,
        paddingHorizontal: 14,
    },
    recommendationCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 10,
        padding: 12,
        width: 220,
    },
    recommendationCardHeader: {
        alignItems: 'center',
        flexDirection: 'row',
    },
    recommendationIcon: {
        borderRadius: 7,
        height: 36,
        width: 36,
    },
    recommendationIconFrame: {
        alignItems: 'center',
        backgroundColor: '#fff2e8',
        borderRadius: 9,
        height: 36,
        justifyContent: 'center',
        marginRight: 9,
        overflow: 'hidden',
        width: 36,
    },
    recommendationTitleWrapper: {
        flex: 1,
        minWidth: 0,
    },
    recommendationCardTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    recommendationHost: {
        fontSize: 10,
        marginTop: 3,
    },
    recommendationCardDescription: {
        fontSize: 12,
        lineHeight: 17,
        marginTop: 10,
        minHeight: 34,
    },
    recommendationButton: {
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 0.5,
        justifyContent: 'center',
        marginTop: 10,
        minHeight: 30,
        paddingHorizontal: 10,
        width: '100%',
    },
    recommendationButtonLabel: {
        fontSize: 12,
    },
    channelContainer: {
        marginTop: 12,
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
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
    rssModalLinkInput: {
        flex: 1,
        paddingRight: 100
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
    },
    parseButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 32
    },
    parseButtonLabel: {
        fontSize: 12,
        fontWeight: '400'
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 12
    },
    parseText: {
        fontSize: 14,
        fontWeight: '400'
    }
});

export default SubscribeScreen;
