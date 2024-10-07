import React, {useEffect, useRef, useState} from 'react';
import {Dimensions, ScrollView, StyleSheet, Text, View} from 'react-native';
import * as echarts from 'echarts/core';
import {GridComponent, TooltipComponent, VisualMapComponent} from 'echarts/components';
import {SvgChart, SVGRenderer} from '@wuba/react-native-echarts';
import {BarChart, TreemapChart} from "echarts/charts";
import {useSafeAreaInsets} from "react-native-safe-area-context";

echarts.use([SVGRenderer, GridComponent, BarChart, TreemapChart, VisualMapComponent, TooltipComponent]);

export const Stock = () => {
    const [acquisitionTime, setAcquisitionTime] = useState(null);
    const skiaRef = useRef(null);
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

    useEffect(() => {
        const fetchDataAndRenderChart = async () => {
            const option = {
                label: {
                    formatter: (value) => {
                        return `${value.name}\n${value.value[2]}%`;
                    },
                    fontSize: 12
                },
                series: {
                    itemStyle: {
                        borderColor: "white",
                        gapWidth: 0.75
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
            };

            const response = await fetch('https://zchengb.top/api/news/stock');
            const data = await response.json();
            setAcquisitionTime(data.acquisitionTime);
            option.series.data = data.stocks;

            let chart;
            if (skiaRef.current) {
                chart = echarts.init(skiaRef.current, 'light', {
                    renderer: 'svg',
                    width: screenWidth,
                    height: screenHeight - insets.top - 18 - 100 - insets.bottom
                });
                chart.setOption(option);
            }
        };

        fetchDataAndRenderChart();
    }, []);

    return <ScrollView style={{flex: 1}} contentContainerStyle={{alignItems: 'center', justifyContent: 'center'}}>
        <View style={styles.timeTipsWrapper}>
            <Text style={styles.timeTipsText}>*更新于 {formatDate(acquisitionTime)} 中国</Text>
        </View>
        <SvgChart ref={skiaRef}/>
    </ScrollView>;
};

const styles = StyleSheet.create({
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