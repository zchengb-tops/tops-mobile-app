import React from 'react';
import { StyleSheet, TouchableOpacity, View, Linking, Platform, Image } from 'react-native';
import Modal from 'react-native-modal';
import { useTheme, Icon } from '@rneui/themed';
import { Text } from './Text';
import { logEvent } from '../analytics';

const UpdateModal = ({
    isVisible,
    onClose,
    updateInfo
}) => {
    const { theme } = useTheme();

    const handleUpdate = async () => {
        try {
            await logEvent('app_update_clicked', {
                version: updateInfo?.latestVersion,
                is_mandatory: updateInfo?.isMandatory,
                platform: Platform.OS
            });

            if (updateInfo?.updateUrl) {
                await Linking.openURL(updateInfo.updateUrl);
            }
            
            // For mandatory updates, keep the modal open
            // For optional updates, close the modal after opening the store
            if (!updateInfo?.isMandatory) {
                onClose();
            }
        } catch (error) {
            console.error('Failed to open update URL:', error);
        }
    };

    const handleClose = async () => {
        if (!updateInfo?.isMandatory) {
            await logEvent('app_update_dismissed', {
                version: updateInfo?.latestVersion,
                platform: Platform.OS
            });
            onClose();
        }
    };

    if (!isVisible || !updateInfo) {
        return null;
    }

    const isMandatory = updateInfo.isMandatory;
    const title = '发现新版本';
    const message = updateInfo.updateMessage || `InfoHub ${updateInfo.latestVersion} 现已推出`;

    return (
        <Modal
            isVisible={isVisible}
            style={{margin: 0}}
            backdropOpacity={0.5}
            onBackdropPress={isMandatory ? undefined : handleClose}
            onSwipeComplete={isMandatory ? undefined : handleClose}
            backdropTransitionOutTiming={0}
            swipeDirection={isMandatory ? undefined : "down"}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: theme.colors.background}]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                            {title}
                        </Text>
                        {!isMandatory && (
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={handleClose}
                            >
                                <Icon name="close-outline" type="ionicon" size={24}
                                      color={theme.colors.text}/>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <View style={styles.updateContent}>
                        <Image
                            source={require('../../assets/images/logo-468.png')}
                            style={styles.appIcon}
                        />
                        <Text style={[styles.appName, {color: theme.colors.text}]}>
                            InfoHub&nbsp;新版本：
                            <Text style={[styles.newVersion, {color: theme.colors.primary}]}>
                                {updateInfo.latestVersion}
                            </Text>
                        </Text>
                        <Text style={[styles.updateMessage, {color: theme.colors.text}]}>
                            {message}
                        </Text>
                        
                        <View style={[styles.buttonContainer]}>
                            {!isMandatory && (
                                <TouchableOpacity
                                    style={[
                                        styles.laterButton, 
                                        {backgroundColor: theme.colors.card},
                                    ]}
                                    onPress={handleClose}
                                >
                                    <Text style={[styles.laterButtonText, {color: theme.colors.text}]}>
                                        稍后提醒
                                    </Text>
                                </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity
                                style={[
                                    styles.updateButton, 
                                    {backgroundColor: theme.colors.indicator},
                                ]}
                                onPress={handleUpdate}
                            >
                                <Icon 
                                    name={Platform.OS === 'ios' ? "logo-apple-appstore" : "download-outline"} 
                                    type="ionicon" 
                                    size={20} 
                                    color="#fff"
                                />
                                <Text style={styles.updateButtonText}>
                                    {Platform.OS === 'ios' ? '前往 App Store' : '立即更新'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4
    },
    updateContent: {
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
    newVersion: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
    },
    updateMessage: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 8,
    },
    horizontalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    laterButton: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    laterButtonHorizontal: {
        flex: 1,
        marginBottom: 0,
    },
    laterButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    updateButtonHorizontal: {
        flex: 1,
        marginTop: 0,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default UpdateModal;
