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
    const {setIsNavBarVisible, setIsPlayBarVisible} = useVisibility();

    useEffect(() => {
        setIsPlayBarVisible(!isFocused);
        setIsNavBarVisible(!isFocused);

        if (!isFocused) {
            setWebviewKey(prevKey => prevKey + 1);
        }

        return () => {
            setIsPlayBarVisible(true);
            setIsNavBarVisible(true);
        };
    }, [isFocused]);

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
