import React, {useContext, useEffect} from "react";
import {SafeAreaView, StyleSheet} from 'react-native';
import {TabBar} from "../components/TabBar";
import {useIsFocused} from "@react-navigation/native";
import {TabView} from "../components/TabView";
import {NewsContext} from "../../utils/NewsProvider";

export const DiscoveryScreen = () => {
    const {fetchNews, initialChannelList} = useContext(NewsContext);
    const isFocused = useIsFocused();

    useEffect(() => {
        initialChannelList();
    }, [isFocused]);

    useEffect(() => {
        fetchNews().then(() => console.log('Successfully fetch news :)'));
    }, []);


    return <SafeAreaView style={styles.container}>
        <TabBar/>
        <TabView/>
    </SafeAreaView>
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
})