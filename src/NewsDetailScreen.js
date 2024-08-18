import React from "react";
import {WebView} from "react-native-webview";

export const NewsDetailScreen = ({route}) => {
    const {url} = route.params;
    return <WebView style={{flex: 1}} source={{uri: url}}
                    allowsFullscreenVideo={false}
                    javaScriptEnabled={true}
                    allowsInlineMediaPlayback={true}
    />;
};
