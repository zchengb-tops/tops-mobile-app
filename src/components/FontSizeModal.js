import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Modal from 'react-native-modal';
import {Icon, useTheme} from '@rneui/themed';
import {FONT_SIZE, Text} from "../components/Text";

const FontSizeModal = ({
                           isVisible,
                           onClose,
                           fontSize,
                           onFontSizeChange,
                       }) => {
    const {theme} = useTheme();
    const fontSizes = [FONT_SIZE.SMALL, FONT_SIZE.MEDIUM, FONT_SIZE.LARGE];

    return (
        <Modal
            isVisible={isVisible}
            style={{margin: 0}}
            backdropOpacity={0.5}
            onBackdropPress={() => onClose()}
            onSwipeComplete={() => onClose()}
            backdropTransitionOutTiming={0}
            swipeDirection="down"
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: theme.colors.background}]}>
                    <View style={styles.modalHeader}>
                        <Text
                            style={[styles.modalTitle, {color: theme.colors.text}]}>选择字体大小</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => onClose()}
                        >
                            <Icon name="close-outline" type="ionicon" size={24}
                                  color={theme.colors.text}/>
                        </TouchableOpacity>
                    </View>
                    {fontSizes.map((size) => (
                        <TouchableOpacity
                            key={size}
                            style={[styles.fontSizeOption, {borderBottomColor: theme.colors.border}]}
                            onPress={() => onFontSizeChange(size)}
                        >
                            <Text
                                style={[styles.fontSizeText, {color: fontSize === size ? theme.colors.primary : theme.colors.text}]}>{size}</Text>
                            {fontSize === size && (
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

export default FontSizeModal; 