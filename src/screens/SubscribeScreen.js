import React, {useCallback, useEffect, useState} from "react";
import {SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Icon} from "@rneui/themed";
import {storage} from "../storage";
import {CHANNEL_COMPONENT_MAP, DEFAULT_CHANNEL_LIST} from "../constant";
import DraggableFlatList, {ScaleDecorator} from 'react-native-draggable-flatlist'
import {trigger} from "react-native-haptic-feedback";

export const SubscribeScreen = () => {
    const [channelList, setChannelList] = useState([]);

    useEffect(() => {
        const stringifyChannelList = storage.getString('channelList')

        if (stringifyChannelList) {
            setChannelList(injectChannelComponentFields(JSON.parse(stringifyChannelList) || DEFAULT_CHANNEL_LIST));
        }
    }, []);

    const injectChannelComponentFields = (channelList) => {
        return channelList.map((channel, index) => (
            {
                ...channel,
                renderIcon: CHANNEL_COMPONENT_MAP[channel.id].renderIcon
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
        storage.set('channelList', JSON.stringify(pureChannelList));
    }

    const renderItem = useCallback(({item, index, drag, isActive}) => {
        return (
            <ScaleDecorator>
                <TouchableOpacity
                    delayLongPress={300}
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
                    <View style={styles.channelInfoWrapper}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            {item.renderIcon(styles.channelIcon, 20, 20)}
                            <View style={styles.channelTextInfoWrapper}>
                                <Text style={styles.channelTitle}>{item.title}</Text>
                                <Text style={styles.channelDesc}>{item.desc}</Text>
                            </View>
                        </View>
                        <View style={styles.channelItemDivider}/>
                    </View>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    }, [])

    return <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
            <Text style={styles.pageTitle}>资讯订阅</Text>
            <TouchableOpacity style={styles.addButton}>
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
            <DraggableFlatList
                data={channelList}
                onDragEnd={({data}) => reorderChannelList(data)}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
            />
        </View>
    </SafeAreaView>;
};

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#fff'},
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
        marginTop: 12,
        flex: 1
    },
    channelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 12,
    },
    channelIcon: {
        marginLeft: 12,
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
    },
    channelDesc: {
        marginTop: 8,
        fontSize: 12,
        color: '#939393'
    },
    channelItemDivider: {
        position: 'absolute',
        bottom: -4,
        alignItems: 'center',
        width: '100%',
        height: 0.2,
        backgroundColor: '#B6B6B6',
    },
    rowItem: {
        height: 100,
        width: 100,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        color: "white",
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
    },
});
