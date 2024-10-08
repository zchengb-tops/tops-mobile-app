import React, {useContext, useEffect, useRef, useState} from 'react';
import {Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import * as echarts from 'echarts/core';
import {GridComponent, TooltipComponent, VisualMapComponent} from 'echarts/components';
import {SvgChart, SVGRenderer} from '@wuba/react-native-echarts';
import {BarChart, TreemapChart} from "echarts/charts";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {NewsContext} from "../../utils/NewsProvider";
import {globalStyles} from "../globalStyle";
import {useNavigation} from "@react-navigation/native";

echarts.use([SVGRenderer, GridComponent, BarChart, TreemapChart, VisualMapComponent, TooltipComponent]);

export const Stock = () => {
    const navigation = useNavigation();
    const {allNews, refreshing, refreshNews} = useContext(NewsContext);
    const [acquisitionTime, setAcquisitionTime] = useState(null);
    const [chartOption, setChartOption] = useState({
        label: {
            formatter: (value) => {
                return `${value.name}\n${value.value[2]}%`;
            },
            fontSize: 12
        },
        series: {
            itemStyle: {
                borderColor: "white",
                gapWidth: 0.5
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
            label: {
                show: true,
            }
        },
        visualMap: {
            show: false,
            precision: 2,
            type: "continuous",
            min: -4.0,
            max: 4.0,
            inRange: {
                color: ["#62cda4", "#4d9e81", "#417d6b", "#334e49", "#543b3f", "#7a494b", "#c76663", "#ed7470"]
            }
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
                height: screenHeight - insets.top - 18 - 100 - insets.bottom
            });
            chart.setOption(chartOption);

            chart.on("click", (e) => {
                navigation.navigate('NewsDetailScreen', {
                    url: "https://zchengb.top/api/t/" + e.data.link,
                })
            });
        }
    };

    useEffect(() => {
        const newChartOption = {...chartOption};
        const stocks = allNews['stock'];
        newChartOption.series.data = stocks;
        setChartOption(newChartOption);
        setAcquisitionTime(stocks[0]?.acquisitionTime);

        renderChart();
    }, [allNews]);

    return <ScrollView
        contentContainerStyle={styles.stockContentWrapper}
        refreshControl={
            <RefreshControl style={globalStyles.refreshControl} refreshing={refreshing} onRefresh={refreshNews}/>
        }
    >
        <View style={styles.timeTipsWrapper}>
            <Text style={styles.timeTipsText}>*更新于 {formatDate(acquisitionTime)} 北京</Text>
        </View>
        <SvgChart ref={chartRef}/>
    </ScrollView>;
};

const styles = StyleSheet.create({
    stockContentWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        color: '#939393'
    }
});