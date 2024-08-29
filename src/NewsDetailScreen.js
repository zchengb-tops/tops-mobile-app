import React, {useState} from "react";
import {WebView} from "react-native-webview";
import {ActivityIndicator, StyleSheet, View} from "react-native";

export const NewsDetailScreen = ({route}) => {
    const {url} = route.params;
    const [loading, setLoading] = useState(true);

    return <View style={styles.container}>
        {
            loading && <View style={styles.loadingContainer}><ActivityIndicator size={"large"}/></View>
        }

        <WebView source={{uri: url}}
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
