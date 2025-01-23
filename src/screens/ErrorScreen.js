import React from "react";
import {Image, StyleSheet, TouchableOpacity} from "react-native";
import {Text} from "../components/Text";
import {useTheme} from "@rneui/themed";

export const ErrorScreen = ({retry, message}) => {
    const {theme} = useTheme();

    return <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.container, {backgroundColor: theme.colors.background}]}
        onPress={retry}
    >
        <Image source={require("../../assets/images/logo-192.png")}
               style={styles.errorLogo}/>
        <Text style={[styles.errorText, {color: theme.colors.text}]}>Oops,
            加载失败</Text>
        <Text style={[styles.tipText, {color: theme.colors.text}]}>
            {
                message || '请检查网络或 '
            }
            {
                !message ? <Text style={styles.retryText}>点击重试</Text> : null
            }
        </Text>
    </TouchableOpacity>
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        paddingTop: "60%"
    },
    errorLogo: {width: 72, height: 72},
    errorText: {marginTop: 12, fontSize: 20, fontWeight: '500'},
    tipText: {marginTop: 8, fontSize: 14},
    retryText: {color: '#F66F00', textDecorationLine: 'underline'}
});
