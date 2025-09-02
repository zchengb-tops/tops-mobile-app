import React from 'react';
import { StyleSheet, TouchableOpacity, View, Linking, Platform, Image } from 'react-native';
import Modal from 'react-native-modal';
import { Icon, useTheme } from '@rneui/themed';
import { Text } from './Text';
import { logEvent } from '../analytics';

const UpgradeModal = ({
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
            
            // Close modal after opening store (for optional updates)
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

    if (!updateInfo || !isVisible) {
        return null;
    }

    return (
        <Modal
            isVisible={isVisible}
            style={{ margin: 0 }}
            backdropOpacity={0.5}
            onBackdropPress={handleClose}
            onSwipeComplete={updateInfo?.isMandatory ? undefined : handleClose}
            backdropTransitionOutTiming={0}
            swipeDirection={updateInfo?.isMandatory ? undefined : "down"}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                            {updateInfo?.isMandatory ? '必须更新' : '发现新版本'}
                        </Text>
                        {!updateInfo?.isMandatory && (
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={handleClose}
                            >
                                <Icon name="close-outline" type="ionicon" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.updateContent}>
                        <View style={styles.appIconContainer}>
                            <Image
                                source={require('../../assets/images/logo-468.png')}
                                style={styles.appIcon}
                            />
                            <View style={styles.versionBadge}>
                                <Text style={[styles.versionText, { color: theme.colors.primary }]}>
                                    v{updateInfo?.latestVersion}
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.updateMessage, { color: theme.colors.text }]}>
                            {updateInfo?.updateMessage}
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.updateButton,
                                    {
                                        backgroundColor: updateInfo?.isMandatory 
                                            ? theme.colors.primary 
                                            : theme.colors.indicator
                                    }
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
                                    {Platform.OS === 'ios' ? '前往 App Store' : '立即下载'}
                                </Text>
                            </TouchableOpacity>

                            {!updateInfo?.isMandatory && (
                                <TouchableOpacity
                                    style={[styles.laterButton, { borderColor: theme.colors.border }]}
                                    onPress={handleClose}
                                >
                                    <Text style={[styles.laterButtonText, { color: theme.colors.secondaryText }]}>
                                        稍后提醒
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {updateInfo?.isMandatory && (
                            <View style={styles.mandatoryNotice}>
                                <Icon name="warning-outline" type="ionicon" size={16} color={theme.colors.primary} />
                                <Text style={[styles.mandatoryText, { color: theme.colors.primary }]}>
                                    此版本为强制更新，需要立即升级才能继续使用
                                </Text>
                            </View>
                        )}
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
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    updateContent: {
        alignItems: 'center',
    },
    appIconContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 16,
    },
    versionBadge: {
        position: 'absolute',
        bottom: -8,
        right: -8,
        backgroundColor: '#F76F00',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    updateMessage: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    laterButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
    },
    laterButtonText: {
        fontSize: 16,
    },
    mandatoryNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: 'rgba(247, 111, 0, 0.1)',
        borderRadius: 8,
        gap: 8,
    },
    mandatoryText: {
        fontSize: 12,
        flex: 1,
        textAlign: 'center',
    },
});

export default UpgradeModal;
