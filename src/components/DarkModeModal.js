import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Modal from 'react-native-modal';
import {Icon, useTheme} from '@rneui/themed';
import {Text} from "./Text";
import {useDarkModeValue} from "../hooks/DarkModeHooks";
import {useDarkModeStore} from "../hooks/DarkModeStore";
import {logEvent} from "../analytics";

const DarkModeModal = ({
                           isVisible,
                           onClose,
                       }) => {
    const {theme} = useTheme();
    const darkMode = useDarkModeValue();
    const setDarkMode = useDarkModeStore.getState().setDarkMode;
    const darkModes = [
        {value: 'system', label: '跟随系统'},
        {value: 'light', label: '浅色模式'},
        {value: 'dark', label: '深色模式'}
    ];

    const onDarkModeChange = async (mode) => {
        setDarkMode(mode);
        await logEvent('dark_mode_change', {
            mode: mode
        });
        onClose();
    }

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
                        <Text
                            style={[styles.modalTitle, {color: theme.colors.text}]}>选择显示模式</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Icon name="close-outline" type="ionicon" size={24}
                                  color={theme.colors.text}/>
                        </TouchableOpacity>
                    </View>
                    {darkModes.map((mode) => (
                        <TouchableOpacity
                            key={mode.value}
                            style={[styles.fontSizeOption, {borderBottomColor: theme.colors.border}]}
                            onPress={() => onDarkModeChange(mode.value)}
                        >
                            <Text
                                style={[styles.fontSizeText, {color: darkMode === mode.value ? theme.colors.primary : theme.colors.text}]}>{mode.label}</Text>
                            {darkMode === mode.value && (
                                <Icon name="checkmark-outline" type="ionicon" size={20}
                                      color={theme.colors.primary}/>
                            )}
                        </TouchableOpacity>
                    ))}
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
    fontSizeOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    fontSizeText: {
        fontSize: 16,
    },
});

export default DarkModeModal;