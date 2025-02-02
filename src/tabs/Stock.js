import React, {useEffect, useRef, useState} from 'react';
import {Dimensions, Platform, RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import * as echarts from 'echarts/core';
import {GridComponent, TooltipComponent, VisualMapComponent} from 'echarts/components';
import {SvgChart, SVGRenderer} from '@wuba/react-native-echarts';
import {BarChart, TreemapChart} from "echarts/charts";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {globalStyles} from "../globalStyle";
import {useNavigation} from "@react-navigation/native";
import {Text} from "../components/Text";
import {useTheme} from '@rneui/themed';
import useNewsStore from '../stores/useNewsStore';
import {useDarkMode} from "../hooks/DarkModeHooks";

echarts.use([SVGRenderer, GridComponent, BarChart, TreemapChart, VisualMapComponent, TooltipComponent]);

export const Stock = () => {
    const normalNews = useNewsStore(state => state.normalNews);
    const normalRefreshing = useNewsStore(state => state.normalRefreshing);
    const refreshNews = useNewsStore(state => state.refreshNews);
    const navigation = useNavigation();
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();
    const [acquisitionTime, setAcquisitionTime] = useState(null);
    const [chartOption, setChartOption] = useState({
        series: {
            itemStyle: {
                borderColor: "white",
                gapWidth: 2,
                borderRadius: 2,
            },
            levels: [
                {
                    itemStyle: {}
                }
            ],
            type: "treemap",
            top: 8,
            left: 8,
            right: 8,
            bottom: 8,
            roam: false,
            nodeClick: false,
            visualDimension: 2,
            data: [],
            breadcrumb: {
                show: false
            },
            labelLayout: (params) => {
                return {y: params.labelRect.y, align: 'center',}
            },
            label: {
                show: true,
                color: '#464646',
                formatter: (value) => {
                    const changeValue = value.value[2];
                    let changeClass = 'neutralChange';

                    if (changeValue.startsWith('+')) {
                        changeClass = 'upChange';
                    } else if (changeValue.startsWith('-')) {
                        changeClass = 'downChange';
                    }

                    return `{name|${value.name}}\n{${changeClass}|${changeValue}%}`;
                },
                lineHeight: 14,
                rich: {
                    name: {
                        fontSize: 12,
                        color: '#464646',
                    },
                    neutralChange: {
                        fontSize: 12,
                        color: '#939393',
                    },
                    upChange: {
                        fontSize: 12,
                        color: '#f05e73',
                    },
                    downChange: {
                        fontSize: 12,
                        color: '#489c80',
                    }
                }
            }
        },
        visualMap: {
            show: false,
            precision: 2,
            type: "piecewise",
            min: -3.0,
            max: 3.0,
            pieces: [
                {min: -Infinity, max: -3.01, color: "#CEEADB"},
                {min: -2.99, max: -1.01, color: "#E2F2E9"},
                {min: -1.0, max: -0.01, color: "#F0F9F4"},
                {value: 0, color: "#E1E5E9"},
                {min: 0.01, max: 1.00, color: "#FFF0F2"},
                {min: 1.01, max: 2.99, color: "#FFE4E6"},
                {min: 3.0, max: +Infinity, color: "#FED0D5"},
            ],
        }
    });
    const chartRef = useRef(null);
    const insets = useSafeAreaInsets();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;

    const formatDate = (dateString) => {
        if (!dateString) {
            return "未知时间";
        }

        const formattedString = dateString.replace(' ', 'T');
        const date = new Date(formattedString);

        return `${date.getFullYear()}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}/${date
            .getDate()
            .toString()
            .padStart(2, '0')} ${date
            .getHours()
            .toString()
            .padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
    }

    const renderChart = () => {
        let chart;
        if (chartRef.current) {
            chart = echarts.init(chartRef.current, 'light', {
                renderer: 'svg',
                width: screenWidth,
                height: Platform.select({
                    ios: screenHeight - insets.top - 18 - 100 - insets.bottom,
                    android: screenHeight - 124
                })
            });
            chart.setOption(chartOption);

            chart.on("click", (e) => {
                navigation.navigate('NewsDetailScreen', {
                    url: e.data.originLink,
                    title: e.data.name
                })
            });
        }
    };

    useEffect(() => {
        const newChartOption = {...chartOption};
        const stocks = normalNews['stock'];
        newChartOption.series.data = stocks;
        setChartOption(newChartOption);
        setAcquisitionTime(stocks[0]?.acquisitionTime);

        renderChart();
    }, [normalNews]);

    return <ScrollView
        contentContainerStyle={styles.stockContentWrapper}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={normalRefreshing} onRefresh={refreshNews} tintColor={isDarkMode ? '#d77f31' : ''}/>
        }
    >
        <View style={styles.timeTipsWrapper}>
            <Text style={[styles.timeTipsText, { color: theme.colors.secondaryText }]}>*更新于 {formatDate(acquisitionTime)} 北京</Text>
        </View>
        <SvgChart ref={chartRef}/>
    </ScrollView>;
};

const styles = StyleSheet.create({
    stockContentWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    loadingView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    timeTipsWrapper: {
        marginTop: 8,
        marginRight: 12,
        width: '100%',
        alignItems: 'flex-end',
    },
    timeTipsText: {
        fontSize: 12,
    }
});