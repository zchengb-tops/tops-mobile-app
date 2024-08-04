import WebView from "react-native-webview";
import React from "react";

export const NewsDetailScreen = ({route}) => {
    const {url} = route.params;
    return <WebView source={{uri: url}} style={{flex: 1}}/>;
};