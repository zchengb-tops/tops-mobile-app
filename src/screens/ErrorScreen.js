import React, {useEffect, useState, useRef} from "react";
import {Image, StyleSheet, TouchableOpacity} from "react-native";
import {Text} from "../components/Text";
import {useTheme} from "@rneui/themed";
import NetInfo from "@react-native-community/netinfo";

export const ErrorScreen = ({fetchNews}) => {
    const {theme} = useTheme();
    const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);
    const lastCheckTime = useRef(0);
    const retryCount = useRef(0);
    const MAX_RETRY_COUNT = 3;
    const MIN_RETRY_INTERVAL = 5000;

    useEffect(() => {
        checkNetworkAndFetch();

        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected) {
                checkNetworkAndFetch();
            }
        });

        return () => {
            unsubscribe();
            retryCount.current = 0;
        };
    }, []);

    const checkNetworkAndFetch = async () => {
        if (isCheckingNetwork) return;
        
        const now = Date.now();
        if (now - lastCheckTime.current < MIN_RETRY_INTERVAL) {
            console.log('Retry too frequent, skipping...');
            return;
        }

        if (retryCount.current >= MAX_RETRY_COUNT) {
            console.log('Max retry count reached, skipping...');
            return;
        }

        try {
            setIsCheckingNetwork(true);
            lastCheckTime.current = now;
            retryCount.current += 1;

            const state = await NetInfo.fetch();
            
            if (state.isConnected) {
                setTimeout(() => {
                    fetchNews()
                        .then(() => {
                            retryCount.current = 0;
                        })
                        .catch(() => {
                            setIsCheckingNetwork(false);
                        });
                }, 1000);
            } else {
                setIsCheckingNetwork(false);
            }
        } catch (error) {
            setIsCheckingNetwork(false);
        }
    };

    const handleRetry = () => {
        retryCount.current = 0;
        checkNetworkAndFetch();
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.container, {backgroundColor: theme.colors.background}]}
            onPress={fetchNews}
        >
            <Image source={require("../../assets/images/logo-192.png")}
                   style={styles.errorLogo}/>
            <Text style={[styles.errorText, {color: theme.colors.text}]}>
                Oops, 加载失败
            </Text>
            <Text style={[styles.tipText, {color: theme.colors.text}]}>
                请检查网络或 <Text style={styles.retryText}>点击重试</Text>
            </Text>
        </TouchableOpacity>
    );
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
