import React from "react";
import {SafeAreaView, StyleSheet, View, Text, TouchableOpacity} from "react-native";
import {Icon} from "@rneui/themed";

export const SubscribeScreen = ({route}) => {
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
                    添加RSS订阅
                </Text>
            </TouchableOpacity>
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
    }
});
