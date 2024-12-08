import React, {useEffect, useLayoutEffect, useState} from "react";
import {WebView} from "react-native-webview";
import {ActivityIndicator, Platform, StyleSheet, View, TouchableOpacity} from "react-native";
import {useIsFocused, useNavigation} from "@react-navigation/native";
import {useVisibility} from "../providers/VisibilityProvider";
import Share from "react-native-share";
import {Icon} from "@rneui/themed";
import {Text} from "../components/Text";

export const NewsDetailScreen = ({route}) => {
    const {url, title} = route.params;
    const [loading, setLoading] = useState(true);
    const [currentUrl, setCurrentUrl] = useState(url);
    const [currentTitle, setCurrentTitle] = useState(title);
    const [webviewKey, setWebviewKey] = useState(1);
    const isFocused = useIsFocused();
    const {setIsNavBarVisible} = useVisibility();
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Icon type={'ionicon'} name={'share-social-outline'} size={16} color={'#464646'}/>
                    <Text style={styles.shareButtonText}>分享</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, currentUrl]);

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

    const handleShare = () => {
        console.log('handle share', currentUrl)
        const options = Platform.select({
            ios: {
                activityItemSources: [
                    {
                        placeholderItem: {type: 'url', content: currentUrl},
                        item: {
                            default: {type: 'url', content: currentUrl},
                        },
                        subject: {
                            default: currentTitle,
                        },
                        linkMetadata: {originalUrl: currentUrl, url: currentUrl, title: currentTitle},
                    },
                ],
            },
        });

        Share.open(options).catch(err => console.log(err));
    };


    const handleNavigationStateChange = (navState) => {
        console.log('handleNavigationStateChange', navState);
        setCurrentUrl(navState.url);
        setCurrentTitle(navState.title);
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
            onNavigationStateChange={handleNavigationStateChange}
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
    },
    shareButton: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginRight: 10,
    },
    shareButtonText: {
        fontSize: 16,
        color: '#464646',
        marginLeft: 4,
    }
});
