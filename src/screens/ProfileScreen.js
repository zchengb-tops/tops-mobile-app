import React, {useState, useEffect} from "react";
import {
    Image,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
    Modal
} from "react-native";
import {Icon} from "@rneui/themed";
import {storage} from "../storage";
import {FONT_SIZE} from "../constant";
import {Text} from "../components/Text";

export const ProfileScreen = () => {
    const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);
    const [selectedFontSize, setSelectedFontSize] = useState(FONT_SIZE.MEDIUM);

    const fontSizes = [FONT_SIZE.SMALL, FONT_SIZE.MEDIUM, FONT_SIZE.LARGE];

    useEffect(() => {
        const savedFontSize = storage.getString('fontSize');
        if (savedFontSize) {
            setSelectedFontSize(savedFontSize);
        }
    }, []);

    const handleFontSizeChange = (size) => {
        setSelectedFontSize(size);
        storage.set('fontSize', size);
        setFontSizeModalVisible(false);
    };

    return <SafeAreaView style={styles.container}>
        <ScrollView>
            <View style={styles.profileWrapper}>
                <Image style={styles.avatar} source={{uri: 'https://zchengb.top/image/avatar.jpeg'}}/>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>zchengb</Text>
                    <Text style={styles.profileDesc}>zxchengb@163.com</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton}>
                    <Icon
                        name="log-out-outline"
                        type="ionicon"
                        size={24}
                        color="#464646"
                    />
                </TouchableOpacity>
            </View>

            <View style={[styles.settingList, styles.firstGroup]}>
                <TouchableOpacity style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        <Icon name="sync-outline" type="ionicon" size={20} color="#464646"/>
                        <Text style={styles.settingText}>同步管理</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20} color="#939393"/>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => setFontSizeModalVisible(true)}
                >
                    <View style={styles.settingLeft}>
                        <Icon name="text-outline" type="ionicon" size={20} color="#464646"/>
                        <Text style={styles.settingText}>字体大小</Text>
                    </View>
                    <View style={styles.settingRight}>
                        <Text style={styles.settingValue}>{selectedFontSize}</Text>
                        <Icon name="chevron-forward-outline" type="ionicon" size={20} color="#939393"/>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        <Icon name="moon-outline" type="ionicon" size={20} color="#464646"/>
                        <Text style={styles.settingText}>深色模式</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20} color="#939393"/>
                </TouchableOpacity>
            </View>

            <View style={[styles.settingList, styles.secondGroup]}>
                <TouchableOpacity style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        <Icon name="chatbox-outline" type="ionicon" size={20} color="#464646"/>
                        <Text style={styles.settingText}>意见反馈</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20} color="#939393"/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        <Icon name="information-circle-outline" type="ionicon" size={20} color="#464646"/>
                        <Text style={styles.settingText}>关于</Text>
                    </View>
                    <Icon name="chevron-forward-outline" type="ionicon" size={20} color="#939393"/>
                </TouchableOpacity>
            </View>
        </ScrollView>

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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>选择字体大小</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setFontSizeModalVisible(false)}
                            >
                                <Icon name="close-outline" type="ionicon" size={24} color="#464646"/>
                            </TouchableOpacity>
                        </View>
                        {fontSizes.map((size) => (
                            <TouchableOpacity
                                key={size}
                                style={styles.fontSizeOption}
                                onPress={() => handleFontSizeChange(size)}
                            >
                                <Text style={styles.fontSizeText}>{size}</Text>
                                {selectedFontSize === size && (
                                    <Icon name="checkmark-outline" type="ionicon" size={20} color="#464646"/>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    </SafeAreaView>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
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
        color: '#464646',
        marginBottom: 4
    },
    profileDesc: {
        fontSize: 14,
        color: '#939393'
    },
    logoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F7F7F7',
        alignItems: 'center',
        justifyContent: 'center'
    },
    settingList: {
        backgroundColor: '#F7F7F7',
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
        borderBottomColor: '#E8E8E8'
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
        color: '#464646',
        marginLeft: 12
    },
    settingValue: {
        fontSize: 16,
        color: '#939393',
        marginRight: 4
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: 'white',
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
        color: '#464646'
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
        borderBottomColor: '#E8E8E8'
    },
    fontSizeText: {
        fontSize: 16,
        color: '#464646'
    }
});

export default ProfileScreen;