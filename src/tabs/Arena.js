import {useNavigation} from "@react-navigation/native";
import {useTheme} from "@rneui/themed";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {
    Animated,
    Easing,
    FlatList,
    Image,
    Linking,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text as RNText,
    View,
} from "react-native";
import Svg, {Circle, Path, Rect} from "react-native-svg";
import {SvgXml} from "react-native-svg";
import {Text} from "../components/Text";
import {PressableNewsItem} from "../components/PressableNewsItem";
import {globalStyles} from "../globalStyle";
import {useDarkMode} from "../hooks/DarkModeHooks";
import useNewsStore from "../stores/useNewsStore";

const LOGO_BASE = "https://infohub.net.cn/oss/arena-logos/v3";
const LOGO_SIZE = 22;
const TITLE_FONT = Platform.select({
    ios: "Georgia",
    android: "serif",
    default: "Georgia",
});

const VENDOR_ALIASES = {
    spacexai: "xai",
    "z.ai": "zai",
    zhipu: "zai",
    "thinking machines": "thinky",
};

const VENDOR_LABELS = {
    alibaba: "Alibaba",
    anthropic: "Anthropic",
    deepseek: "DeepSeek",
    google: "Google",
    meta: "Meta",
    minimax: "MiniMax",
    moonshot: "Moonshot",
    nvidia: "Nvidia",
    openai: "OpenAI",
    tencent: "Tencent",
    thinky: "Thinky",
    xai: "SpaceXAI",
    xiaomi: "Xiaomi",
    zai: "Z.ai",
};

const MONO_LOGOS = {
    anthropic: true,
    openai: true,
    zai: true,
    xai: true,
    xiaomi: true,
    thinky: true,
};

const METRICS = [
    {key: "score", label: "Net"},
    {key: "confirmedSuccess", label: "Success"},
    {key: "praiseComplaint", label: "Praise"},
    {key: "steerability", label: "Steer"},
];

const SEGMENT_WIDTH = 120;
const SEGMENT_PAD = 3;
const SEGMENT_HEIGHT = 28;
const SEGMENT_THUMB_WIDTH = (SEGMENT_WIDTH - SEGMENT_PAD * 2) / 2;
const SEGMENT_THUMB_HEIGHT = SEGMENT_HEIGHT - SEGMENT_PAD * 2;
const SWAP_EASING = Easing.bezier(0.22, 1, 0.36, 1);

const sanitizeSvg = (xml) =>
    String(xml || "").replace(/offset="\.(\d+(?:\.\d+)?)%"/g, 'offset="0.$1%"');

const themedMonoSvg = (xml, isDarkMode) => {
    if (!xml || !isDarkMode) {
        return xml;
    }
    return String(xml)
        .replace(/#111111/gi, "#FFFFFF")
        .replace(/#000000/gi, "#FFFFFF")
        .replace(/#000(?![0-9a-fA-F])/g, "#FFFFFF")
        .replace(/\bfill="black"/gi, 'fill="#FFFFFF"')
        .replace(/\bstroke="black"/gi, 'stroke="#FFFFFF"');
};

const normalizeVendor = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) {
        return "";
    }
    return VENDOR_ALIASES[raw] || raw.replace(/\s+/g, "");
};

const formatScore = (score) => {
    if (score === undefined || score === null) {
        return "—";
    }
    return `${(Number(score) * 100).toFixed(1)}%`;
};

const formatSessions = (sessions) => {
    if (sessions === undefined || sessions === null) {
        return "—";
    }
    return Number(sessions).toLocaleString("en-US");
};

const formatDate = (date) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
    if (!match) {
        return date || "";
    }
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
};

const vendorKeyOf = (row) => {
    if (row?.properties?.section === "lab") {
        return normalizeVendor(row.title);
    }
    return normalizeVendor(row?.properties?.vendor || "");
};

const logoUrlOf = (row) => {
    if (row?.properties?.logoUrl) {
        return row.properties.logoUrl;
    }
    const key = vendorKeyOf(row);
    if (!key || !VENDOR_LABELS[key]) {
        return null;
    }
    return `${LOGO_BASE}/${key}.svg`;
};

const displayTitleOf = (row) => {
    if (row?.properties?.section === "lab") {
        const key = normalizeVendor(row.title);
        return VENDOR_LABELS[key] || row.title;
    }
    return row.title;
};

const subtitleOf = (row) => {
    if (row?.properties?.section === "lab") {
        return row.properties.bestModel || "";
    }
    const key = normalizeVendor(row?.properties?.vendor || "");
    if (VENDOR_LABELS[key]) {
        return VENDOR_LABELS[key];
    }
    const vendor = row?.properties?.vendor || "";
    return vendor ? vendor.charAt(0).toUpperCase() + vendor.slice(1) : "";
};

const metricTone = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || value == null) {
        return "flat";
    }
    if (numeric > 0) {
        return "up";
    }
    if (numeric < 0) {
        return "down";
    }
    return "flat";
};

const MetaIcon = ({name, color}) => {
    if (name === "date") {
        return (
            <Svg width={13} height={13} viewBox="0 0 16 16">
                <Rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke={color} strokeWidth="1.2" />
                <Path d="M2 6.5h12M5 2v2.5M11 2v2.5" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
            </Svg>
        );
    }
    if (name === "sessions") {
        return (
            <Svg width={13} height={13} viewBox="0 0 16 16">
                <Circle cx="6" cy="5.5" r="2" fill="none" stroke={color} strokeWidth="1.2" />
                <Circle cx="10.5" cy="6" r="1.6" fill="none" stroke={color} strokeWidth="1.2" />
                <Path
                    d="M2.5 12.5c.4-2 1.8-3 3.5-3s3.1 1 3.5 3M9 10c1.2.1 2.3.8 2.8 2.5"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            </Svg>
        );
    }
    return (
        <Svg width={13} height={13} viewBox="0 0 16 16">
            <Path
                d="M3 5.5 8 3l5 2.5v5L8 13l-5-2.5v-5z"
                fill="none"
                stroke={color}
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            <Path d="M8 8v5M3 5.5 8 8l5-2.5" fill="none" stroke={color} strokeWidth="1.2" />
        </Svg>
    );
};

const MethodologyIcon = ({color}) => (
    <Svg width={13} height={13} viewBox="0 0 24 24">
        <Path
            d="M3 12C3.00015 8.14286 4.28571 3 6.85714 3C10.7143 2.9999 13.2857 21 17.1429 21C19.7143 21 21 15.8571 21 12"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M3 12H5M19 12H21M15.5 12H16.5M7.5 12H8.5"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const MethodologyArrow = ({color}) => (
    <Svg width={13} height={13} viewBox="0 0 24 24">
        <Path
            d="M3 12L21 12M21 12L12.5 3.5M21 12L12.5 20.5"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const ArenaCard = ({animKey, index, style, onPress, children}) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        opacity.setValue(0);
        translateY.setValue(8);
        const delay = Math.min(index, 12) * 40;
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 220,
                delay,
                easing: SWAP_EASING,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 220,
                delay,
                easing: SWAP_EASING,
                useNativeDriver: true,
            }),
        ]).start();
    }, [animKey, index, opacity, translateY]);

    return (
        <Animated.View style={{opacity, transform: [{translateY}]}}>
            <PressableNewsItem style={style} onPress={onPress}>
                {children}
            </PressableNewsItem>
        </Animated.View>
    );
};

const LabLogo = ({row, isDarkMode}) => {
    const uri = logoUrlOf(row);
    const mono = !!MONO_LOGOS[vendorKeyOf(row)];
    const [svgXml, setSvgXml] = useState(null);
    const [svgFailed, setSvgFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (!uri || !/\.svg(\?|#|$)/i.test(uri)) {
            setSvgXml(null);
            setSvgFailed(false);
            return undefined;
        }
        setSvgXml(null);
        setSvgFailed(false);
        fetch(uri)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`logo ${res.status}`);
                }
                return res.text();
            })
            .then((xml) => {
                if (!cancelled) {
                    setSvgXml(sanitizeSvg(xml));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSvgFailed(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [uri]);

    if (!uri || svgFailed) {
        const label = subtitleOf(row) || row.title || "?";
        return (
            <View style={[styles.logoFallback, isDarkMode && styles.logoFallbackDark]}>
                <Text style={[styles.logoFallbackText, isDarkMode && {color: "#F2F0EB"}]}>
                    {label.charAt(0).toUpperCase()}
                </Text>
            </View>
        );
    }
    if (/\.svg(\?|#|$)/i.test(uri)) {
        if (!svgXml) {
            return <View style={styles.logoSlot} />;
        }
        const xml = mono ? themedMonoSvg(svgXml, isDarkMode) : svgXml;
        return <SvgXml width={LOGO_SIZE} height={LOGO_SIZE} xml={xml} />;
    }
    return (
        <Image
            source={{uri}}
            style={[styles.logoImage, mono && isDarkMode ? styles.logoMono : null]}
        />
    );
};

const ArenaSegment = ({viewMode, onChange, thumbX, trackColor, thumbColor, activeText, mutedText}) => (
    <View style={[styles.segment, {backgroundColor: trackColor}]}>
        <Animated.View
            pointerEvents="none"
            style={[
                styles.segmentThumb,
                {
                    backgroundColor: thumbColor,
                    transform: [{translateX: thumbX}],
                },
            ]}
        />
        <Pressable style={styles.segmentBtn} onPress={() => onChange("models")}>
            <RNText
                allowFontScaling={false}
                style={[
                    styles.segmentText,
                    {color: viewMode === "models" ? activeText : mutedText},
                ]}
            >
                Models
            </RNText>
        </Pressable>
        <Pressable style={styles.segmentBtn} onPress={() => onChange("labs")}>
            <RNText
                allowFontScaling={false}
                style={[
                    styles.segmentText,
                    {color: viewMode === "labs" ? activeText : mutedText},
                ]}
            >
                Labs
            </RNText>
        </Pressable>
    </View>
);

export const Arena = () => {
    const normalNews = useNewsStore((state) => state.normalNews);
    const normalRefreshing = useNewsStore((state) => state.normalRefreshing);
    const refreshNews = useNewsStore((state) => state.refreshNews);
    const navigation = useNavigation();
    const {theme} = useTheme();
    const isDarkMode = useDarkMode();
    const [viewMode, setViewMode] = useState("models");
    const [swapKey, setSwapKey] = useState(0);
    const thumbX = useRef(new Animated.Value(0)).current;
    const switchingRef = useRef(false);

    const news = normalNews?.arena || [];
    const models = useMemo(
        () => news.filter((item) => item?.properties?.section === "rank"),
        [news]
    );
    const labs = useMemo(
        () => news.filter((item) => item?.properties?.section === "lab"),
        [news]
    );
    const rows = viewMode === "labs" ? labs : models;
    const publishDate = models[0]?.properties?.publishDate || labs[0]?.properties?.publishDate || "";
    const totalSessions = models.reduce(
        (sum, row) => sum + (Number(row?.properties?.sessions) || 0),
        0
    );
    const countLabel = `${rows.length} ${viewMode === "models" ? "models" : "labs"}`;

    useEffect(() => {
        console.log("start to render arena", {models: models.length, labs: labs.length});
    }, [models.length, labs.length]);

    useEffect(() => {
        Animated.timing(thumbX, {
            toValue: viewMode === "labs" ? SEGMENT_THUMB_WIDTH : 0,
            duration: 220,
            easing: SWAP_EASING,
            useNativeDriver: false,
        }).start();
    }, [viewMode, thumbX]);

    const openRow = (item) => {
        navigation.navigate("NewsDetailScreen", {
            url: item.link || "https://arena.ai/leaderboard/agent",
            title: item.title,
        });
    };

    const switchViewMode = (mode) => {
        if (mode === viewMode || switchingRef.current) {
            return;
        }
        switchingRef.current = true;
        setViewMode(mode);
        setSwapKey((key) => key + 1);
        requestAnimationFrame(() => {
            switchingRef.current = false;
        });
    };

    const surface = theme.colors.background;
    const cardBg = isDarkMode ? "#2A2A2A" : "#FFFFFF";
    const hairline = isDarkMode ? theme.colors.border : "#E5E7E7";
    const ink = theme.colors.text;
    const muted = isDarkMode ? "#AAAAAA" : "#8A8886";
    const segmentTrack = isDarkMode ? "#2F2F2F" : "#EEEBE6";
    const segmentThumbColor = ink;
    const segmentActiveText = isDarkMode ? "#1A1A1A" : "#FFFFFF";
    const methodologyBg = isDarkMode ? "#2A2A2A" : "#F3F1ED";
    const green = isDarkMode ? "#3DDC84" : "#1F9D57";
    const red = isDarkMode ? "#EF6B6B" : "#D14B4B";

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.titleRow}>
                <Pressable onPress={() => Linking.openURL("https://arena.ai/leaderboard/agent")}>
                    <Text style={[styles.title, {color: ink}]}>{`Agent Arena`}</Text>
                </Pressable>
                <Pressable
                    style={[styles.methodology, {backgroundColor: methodologyBg}]}
                    onPress={() => Linking.openURL("https://arena.ai/blog/agent-arena-methodology/")}
                >
                    <MethodologyIcon color={ink} />
                    <Text style={[styles.methodologyText, {color: ink}]}>View Methodology</Text>
                    <MethodologyArrow color={ink} />
                </Pressable>
            </View>
            <Text style={[styles.desc, {color: muted}]}>
                Dynamic ranking of models for real-world agentic tasks, based on tool reliability,
                task completion, and steerability.
            </Text>
            <View style={styles.toolbar}>
                <View style={styles.metaRow}>
                    {!!publishDate && (
                        <View style={styles.metaItem}>
                            <MetaIcon name="date" color={muted} />
                            <Text style={[styles.meta, {color: muted}]} numberOfLines={1}>
                                {formatDate(publishDate)}
                            </Text>
                        </View>
                    )}
                    {!!totalSessions && (
                        <View style={styles.metaItem}>
                            <MetaIcon name="sessions" color={muted} />
                            <Text style={[styles.meta, {color: muted}]} numberOfLines={1}>
                                {formatSessions(totalSessions)} sessions
                            </Text>
                        </View>
                    )}
                    <View style={styles.metaItem}>
                        <MetaIcon name="count" color={muted} />
                        <Text style={[styles.meta, {color: muted}]} numberOfLines={1}>
                            {countLabel}
                        </Text>
                    </View>
                </View>
                <View style={styles.segmentRow}>
                    <ArenaSegment
                        viewMode={viewMode}
                        onChange={switchViewMode}
                        thumbX={thumbX}
                        trackColor={segmentTrack}
                        thumbColor={segmentThumbColor}
                        activeText={segmentActiveText}
                        mutedText={muted}
                    />
                </View>
            </View>
        </View>
    );

    const renderItem = ({item, index}) => {
        const rank = Number(item.rankNum);
        const delta = Number(item?.properties?.delta);
        return (
            <ArenaCard
                animKey={swapKey}
                index={index}
                style={[
                    styles.card,
                    {
                        backgroundColor: cardBg,
                        borderColor: hairline,
                        marginTop: index === 0 ? 10 : 8,
                    },
                ]}
                onPress={() => openRow(item)}
            >
                <View style={styles.cardRank}>
                    <Text
                        style={[
                            styles.rankNum,
                            rank === 1 && styles.rankFirst,
                            rank === 2 && styles.rankSecond,
                            rank === 3 && styles.rankThird,
                            rank > 3 && {color: ink},
                        ]}
                    >
                        {item.rankNum}
                    </Text>
                    {delta > 0 ? (
                        <Text style={[styles.delta, {color: green}]}>{`▲${delta}`}</Text>
                    ) : delta < 0 ? (
                        <Text style={[styles.delta, {color: red}]}>{`▼${Math.abs(delta)}`}</Text>
                    ) : (
                        <Text style={[styles.delta, {color: muted}]}>—</Text>
                    )}
                </View>
                <View style={styles.cardMain}>
                    <View style={styles.cardLeft}>
                        <View style={styles.logoWrap}>
                            <LabLogo row={item} isDarkMode={isDarkMode} />
                        </View>
                        <View style={styles.textWrap}>
                            <Text style={[styles.modelName, {color: ink}]} numberOfLines={1}>
                                {displayTitleOf(item)}
                            </Text>
                            <Text style={[styles.modelSub, {color: muted}]} numberOfLines={1}>
                                {subtitleOf(item)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.cardRight}>
                        {METRICS.map((metric) => {
                            const value = item?.properties?.[metric.key];
                            const tone = metricTone(value);
                            return (
                                <View key={metric.key} style={styles.metric}>
                                    <Text style={[styles.metricLabel, {color: muted}]}>
                                        {metric.label}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.metricValue,
                                            tone === "up" && {color: green},
                                            tone === "down" && {color: red},
                                            tone === "flat" && {color: muted},
                                        ]}
                                    >
                                        {`${formatScore(value)}${tone === "up" ? " ▲" : tone === "down" ? " ▼" : ""}`}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ArenaCard>
        );
    };

    const renderFooter = () => (
        <Pressable
            style={styles.footer}
            onPress={() => Linking.openURL("https://arena.ai/leaderboard/agent")}
        >
            <Text style={[styles.footerLink, {color: muted}]}>View on arena.ai</Text>
        </Pressable>
    );

    if (!models.length && !labs.length && !normalRefreshing) {
        return (
            <View style={[styles.empty, {backgroundColor: surface}]}>
                <Text style={[styles.emptyText, {color: muted}]}>
                    暂无 Arena 榜单数据，下拉刷新试试。
                </Text>
                <Pressable onPress={() => Linking.openURL("https://arena.ai/leaderboard/agent")}>
                    <Text style={[styles.emptyLink, {color: ink}]}>View on arena.ai</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, {backgroundColor: surface}]}>
            <FlatList
                style={styles.list}
                contentContainerStyle={styles.contentContainer}
                data={rows}
                extraData={swapKey}
                keyExtractor={(item, index) =>
                    `${viewMode}-${item.rankNum}-${item.title}-${index}`
                }
                ListHeaderComponent={renderHeader()}
                ListFooterComponent={renderFooter()}
                renderItem={renderItem}
                initialNumToRender={12}
                refreshControl={
                    <RefreshControl
                        style={globalStyles.refreshControl}
                        refreshing={normalRefreshing}
                        onRefresh={refreshNews}
                        tintColor={isDarkMode ? "#d77f31" : ink}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 28,
    },
    header: {
        paddingTop: 8,
        paddingBottom: 2,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
    },
    title: {
        fontFamily: TITLE_FONT,
        fontSize: 24,
        fontWeight: "300",
        letterSpacing: -0.7,
        lineHeight: 28,
    },
    methodology: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 6,
    },
    methodologyText: {
        fontSize: 11,
        fontWeight: "500",
        lineHeight: 14,
    },
    desc: {
        marginTop: 8,
        fontSize: 11,
        lineHeight: 16,
    },
    toolbar: {
        marginTop: 10,
        gap: 8,
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        gap: 12,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
    },
    meta: {
        fontSize: 11,
        fontWeight: "400",
        lineHeight: 14,
        fontVariant: ["tabular-nums"],
    },
    segmentRow: {
        marginTop: 4,
        marginBottom: 4,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    segment: {
        position: "relative",
        flexShrink: 0,
        width: SEGMENT_WIDTH,
        height: SEGMENT_HEIGHT,
        flexDirection: "row",
        padding: SEGMENT_PAD,
        borderRadius: 999,
    },
    segmentThumb: {
        position: "absolute",
        top: SEGMENT_PAD,
        left: SEGMENT_PAD,
        width: SEGMENT_THUMB_WIDTH,
        height: SEGMENT_THUMB_HEIGHT,
        borderRadius: 999,
    },
    segmentBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
    segmentText: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.15,
        lineHeight: 14,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 10,
    },
    cardRank: {
        width: 26,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    rankNum: {
        fontSize: 15,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
        lineHeight: 16,
    },
    rankFirst: {
        color: "#E67700",
    },
    rankSecond: {
        color: "#F59F00",
    },
    rankThird: {
        color: "#FCC419",
    },
    delta: {
        marginTop: 1,
        fontSize: 9,
        fontWeight: "600",
        lineHeight: 11,
    },
    cardMain: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        minWidth: 0,
    },
    cardLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
    },
    logoWrap: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    logoSlot: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
    },
    logoImage: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
        resizeMode: "contain",
    },
    logoMono: {
        tintColor: "#FFFFFF",
    },
    logoFallback: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: "#EEEBE6",
        alignItems: "center",
        justifyContent: "center",
    },
    logoFallbackDark: {
        backgroundColor: "#2F2F2F",
    },
    logoFallbackText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#464646",
    },
    textWrap: {
        flex: 1,
        minWidth: 0,
    },
    modelName: {
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 16,
    },
    modelSub: {
        marginTop: 1,
        fontSize: 10,
        lineHeight: 13,
    },
    cardRight: {
        width: 148,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        flexShrink: 0,
    },
    metric: {
        width: 69,
        minWidth: 0,
    },
    metricLabel: {
        fontSize: 8,
        lineHeight: 10,
        textTransform: "uppercase",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(0,0,0,0.18)",
        alignSelf: "flex-start",
    },
    metricValue: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
        lineHeight: 14,
    },
    footer: {
        marginTop: 12,
        alignItems: "center",
        paddingVertical: 6,
    },
    footerLink: {
        fontSize: 11,
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        textAlign: "center",
    },
    emptyLink: {
        fontSize: 14,
        textDecorationLine: "underline",
    },
});
