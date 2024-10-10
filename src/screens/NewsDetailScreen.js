import React, {useEffect, useState} from "react";
import {WebView} from "react-native-webview";
import {ActivityIndicator, StyleSheet, View} from "react-native";
import {useIsFocused} from "@react-navigation/native";
import {useVisibility} from "../../utils/VisibilityProvider";

export const NewsDetailScreen = ({route}) => {
    const {url} = route.params;
    const [loading, setLoading] = useState(true);
    const [webviewKey, setWebviewKey] = useState(1);
    const isFocused = useIsFocused();
    const {setIsNavBarVisible} = useVisibility();

    useEffect(() => {
        setIsNavBarVisible(!isFocused);

        if (!isFocused) {
            setWebviewKey(prevKey => prevKey + 1);
        }

        return () => {
            setIsNavBarVisible(true);
        };
    }, [isFocused]);

    const handleShouldStartLoadWithRequest = (request) => {
        const url = request.url;

        return url.startsWith('http') || url.startsWith('https');
    };


    return <View style={styles.container}>
        {
            loading && <View style={styles.loadingContainer}><ActivityIndicator/></View>
        }

        <WebView
            key={webviewKey}
            source={{uri: url}}
            originWhitelist={['*']}
            allowsFullscreenVideo={false}
            javaScriptEnabled={true}
            allowsInlineMediaPlayback={true}
            onLoadEnd={(e) => {
                setLoading(false);
            }}
            onError={(syntheticEvent) => {
                const {nativeEvent} = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
            }}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        />
    </View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
