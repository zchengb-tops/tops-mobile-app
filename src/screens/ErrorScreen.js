import React from "react";
import {Image, StyleSheet, Text, TouchableOpacity} from "react-native";

export const ErrorScreen = ({fetchNews}) => {
    return <TouchableOpacity
        activeOpacity={0.8}
        style={styles.container}
        onPress={() => fetchNews().then(e => console.log('fetch'))}
    >
        <Image source={require("../../assets/images/icon-64.png")}
               style={styles.errorLogo}/>
        <Text style={styles.errorText}>Oops,
            加载失败</Text>
        <Text style={styles.tipText}>请检查网络或 <Text
            style={styles.retryText}>点击重试</Text>
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
