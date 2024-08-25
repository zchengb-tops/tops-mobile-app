import React from 'react';
import {ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import TopsIcon from '../../assets/icons/tops-logo.svg';
import {useTrack, useTrackProgress, useTrackShowing, useTrackStatus} from "../hooks/TrackHooks";
import {Icon, Slider} from "@rneui/themed";
import TrackPlayer, {State} from "react-native-track-player";

export const PlayerBar = () => {
    const position = useTrackProgress();
    const currentTrack = useTrack();
    const showing = useTrackShowing();
    const status = useTrackStatus();

    return (
        showing ?
            <View style={styles.playerBarExternalWrapper}>
                <View style={styles.playerBarInternalWrapper}>
                    <View style={styles.trackInfo}>
                        {
                            currentTrack?.artwork
                                ?
                                <Image style={styles.cover} source={{uri: currentTrack?.artwork}}/>
                                :
                                <TopsIcon width={40} height={40}/>
                        }

                        <View style={styles.trackTextInfo}>
                            <Text style={styles.title} numberOfLines={1}
                                  ellipsizeMode='tail'>{currentTrack?.title}</Text>
                            <Text style={styles.author} numberOfLines={1}
                                  ellipsizeMode='tail'>{currentTrack?.artist}</Text>
                        </View>
                    </View>
                    <View style={styles.controls}>
                        <Text style={{color: '#939393'}}>
                            01:20:13
                        </Text>
                        <Slider
                            maximumTrackTintColor="#D9D9D9"
                            maximumValue={100}
                            minimumTrackTintColor="#464646"
                            minimumValue={0}
                            orientation="horizontal"
                            step={1}
                            style={{
                                height: 12,
                                marginLeft: 8,
                                marginRight: 8,
                                width: 150,
                                // backgroundColor: 'pink'
                            }}
                            thumbStyle={{height: 4, width: 4}}
                            thumbTintColor="#464646"
                            value={20}
                            pointerEvents="none"
                        />
                        <Text style={{color: '#939393'}}>
                            -00:02:11
                        </Text>
                        {
                            currentTrack ?
                                <View style={{flexDirection: 'row', marginLeft: 12}}>
                                    {status === State.Playing ? (
                                        <TouchableOpacity onPress={() => {
                                            TrackPlayer.pause();
                                        }}>
                                            <Icon
                                                size={20}
                                                name='pause'
                                                type='ionicon'
                                                color='#464646'
                                            />
                                        </TouchableOpacity>
                                    ) : (
                                        status === State.Loading || status === State.Buffering || status === State.Ready
                                            ?
                                            <ActivityIndicator size="small" color={'#464646'}/>
                                            :
                                            <TouchableOpacity onPress={() => {
                                                TrackPlayer.play();
                                            }}>
                                                <Icon
                                                    size={20}
                                                    name='play'
                                                    type='ionicon'
                                                    color='#464646'
                                                />
                                            </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={styles.playForward} onPress={() => {
                                        TrackPlayer.getProgress().then((progress) => {
                                            let newPosition = progress.position + 15;
                                            newPosition = newPosition > progress.duration ? progress.duration : newPosition;
                                            TrackPlayer.seekTo(newPosition);
                                        })
                                    }}>
                                        <Icon
                                            size={20}
                                            name='play-forward'
                                            type='ionicon'
                                            color='#464646'
                                        />
                                    </TouchableOpacity>
                                </View>
                                : <></>
                        }
                    </View>
                </View>
            </View>
            : <></>
    );
};

const styles = StyleSheet.create({
    playerBarExternalWrapper: {
        position: 'absolute',
        bottom: 4,
        width: '100%',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        shadowColor: '#000', // 阴影的颜色
        shadowOffset: {width: 0, height: 2}, // 阴影的偏移量
        shadowOpacity: 0.25, // 阴影的透明度
        shadowRadius: 3.84, // 阴影的模糊半径
    },
    playerBarInternalWrapper: {
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 8,
        width: '100%',
    },
    cover: {
        width: 40,
        height: 40,
        borderRadius: 4
    },
    trackInfo: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
    },
    trackTextInfo: {
        width: '100%',
        marginLeft: 12,
        flex: 1
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
    },
    author: {
        color: '#939393',
        fontSize: 14,
        marginTop: 4
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 8,
    },
    playForward: {
        marginLeft: 8
    }
});
