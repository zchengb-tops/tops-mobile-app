import React from 'react';
import {Platform, Image, Linking, StyleSheet, TouchableOpacity, View} from 'react-native';
import Modal from 'react-native-modal';
import {Icon, useTheme} from '@rneui/themed';
import {Text} from './Text';
import * as Application from 'expo-application';

const AboutModal = ({isVisible, onClose}) => {
    const {theme} = useTheme();
    
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
                        <Text style={[styles.modalTitle, {color: theme.colors.text}]}>关于</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Icon name="close-outline" type="ionicon" size={24}
                                  color={theme.colors.text}/>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.aboutContent}>
                        <Image
                            source={require('../../assets/images/logo-468.png')}
                            style={styles.appIcon}
                        />
                        <Text style={[styles.appName, {color: theme.colors.text}]}>InfoHub</Text>
                        <Text
                            style={[styles.appVersion, {color: theme.colors.secondaryText}]}>版本 {Application.nativeApplicationVersion || '未知'}{Platform.OS === 'ios' ? ` (${Application.nativeBuildVersion})` : ''}</Text>
                        <Text style={[styles.appDesc, {color: theme.colors.text}]}>
                            InfoHub是一款支持自定义订阅RSS源的资讯聚合阅读应用，也是我用爱发电的产品，如果 InfoHub
                            对您有起到帮助，欢迎您给我支持或反馈，让 InfoHub 走得更远 :)
                        </Text>
                        <TouchableOpacity
                            style={[styles.aboutButton, {backgroundColor: theme.colors.indicator}]}
                            onPress={() => Linking.openURL('https://infohub.net.cn/')}
                        >
                            <Icon name="globe-outline" type="ionicon" size={20} color="#fff"/>
                            <Text style={styles.aboutButtonText}>InfoHub 官网</Text>
                        </TouchableOpacity>
                    </View>
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
    aboutContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 16,
        marginBottom: 16,
    },
    appName: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    appVersion: {
        fontSize: 14,
        marginBottom: 16,
    },
    appDesc: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    aboutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    aboutButtonText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 8,
    },
});

export default AboutModal; 