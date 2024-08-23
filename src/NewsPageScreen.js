import React, {useContext, useEffect, useState} from "react";
import {RefreshControl, SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import {Tab, TabView} from "@rneui/themed";
import WeiboIcon from "../assets/icons/weibo.svg";
import ZhihuIcon from "../assets/icons/zhihu.svg";
import SspaiIcon from "../assets/icons/sspai.svg";
import BilibiliIcon from "../assets/icons/bilibili.svg";
import XiaoyuzhouIcon from "../assets/icons/xiaoyuzhou.svg";
import StockIcon from "../assets/icons/stock.svg";
import DoubanIcon from "../assets/icons/douban.svg";
import HistoryIcon from "../assets/icons/history.svg";
import NngroupIcon from "../assets/icons/nngroup.svg";
import TiobeIcon from "../assets/icons/tiobe.svg";
import {Sina} from "./tabs/Sina";
import {GlobalContext} from "../utils/GlobalContext";
import {Zhihu} from "./tabs/Zhihu";
import {Sspai} from "./tabs/Sspai";
import {Xiaoyuzhou} from "./tabs/Xiaoyuzhou";
import {PlayerBar} from "./components/PlayerBar";


export const NewsPageScreen = () => {
    const [tabIndex, setTabIndex] = useState(3);
    const {globalState, setGlobalState} = useContext(GlobalContext);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [channelList, setChannelList] = useState([
        {
            id: 'sina',
            title: '新浪微博',
            tabTitle: '微博',
            icon: <WeiboIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '新浪微博TOP50热搜榜',
            enable: true,
            component: <Sina/>
        },
        {
            id: 'zhihu',
            title: '知乎',
            tabTitle: '知乎',
            icon: <ZhihuIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '知乎TOP50热榜',
            enable: true,
            component: <Zhihu/>
        },
        {
            id: 'sspai',
            title: '少数派',
            tabTitle: '少数派',
            icon: <SspaiIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '高效工作，品质生活',
            enable: true,
            component: <Sspai/>
        },
        {
            id: 'xiaoyuzhou',
            title: '小宇宙',
            tabTitle: '小宇宙FM',
            icon: <XiaoyuzhouIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '小宇宙FM每日榜单（最热榜、锋芒榜、新星榜）',
            enable: true,
            component: <Xiaoyuzhou/>
        },
        {
            id: 'stock',
            title: '沪深实时热力图',
            tabTitle: '实时沪深',
            icon: <StockIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '汇集沪深股市各大板块热力图',
            enable: false,
            component: <></>
        },
        {
            id: 'doubanMovie',
            title: '豆瓣電影口碑榜',
            tabTitle: '豆瓣',
            icon: <DoubanIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '每周最新的全球電影口碑排行榜',
            enable: false,
            component: <></>
        },
        {
            id: 'bilibili',
            title: '哔哩哔哩',
            tabTitle: '哔哩哔哩',
            icon: <BilibiliIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '哔哩哔哩每周必看榜单',
            enable: false,
            component: <></>
        },
        {
            id: 'nnGroup',
            title: 'Nielsen Norman Group',
            tabTitle: 'NN/g',
            icon: <NngroupIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: 'World Leaders in Research-Based User Experience',
            enable: false,
            component: <></>
        },
        {
            id: 'tiobe',
            title: 'TIOBE编程语言榜单',
            tabTitle: 'TIOBE',
            icon: <TiobeIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '每月最新的全球编程语言排行榜',
            enable: false,
            component: <></>
        },
        {
            id: 'history',
            title: '历史上的今天',
            tabTitle: '历史薄',
            icon: <HistoryIcon width={20} height={20} style={styles.tabBarIcon}/>,
            desc: '所以历史上的今天都发生了什么？🧐',
            enable: false,
            component: <></>
        }
    ]);

    useEffect(() => {
        fetchNews().then(() => console.log('Successfully fetch news :)'));
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            // const response = await fetch('https://zchengb.top/api/normal-news');
            // const data = await response.json();
            const data = {
                "zhihu": [
                    {
                        "rankNum": "1",
                        "title": "如何评价《黑神话：悟空》这款游戏？它到底好不好玩？",
                        "shortLink": "mQ3Avu",
                        "properties": {
                            "banner": "https://picx.zhimg.com/80/v2-1d1200e233bace27c87283104dbe1a00_1440w.png",
                            "metrics": "3758 万",
                            "excerpt": "《黑神话：悟空》已正式解锁，如何评价这款游戏？它到底好不好玩？ 本题已收录至「重走西游，直面天命」圆桌，关注圆桌，与优秀答主一同重走西游>> "
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "2",
                        "title": "《黑神话：悟空》预售超 4 亿，A 股概念股已狂飙，其对资本市场后续影响会如何？",
                        "shortLink": "qYNjmu",
                        "properties": {
                            "banner": "https://pic2.zhimg.com/50/v2-ba984b6a16dd49b689aab3546b4eb331_b.jpg",
                            "metrics": "621 万",
                            "excerpt": "8 月 20 日，《黑神话：悟空》将全球解锁，正式上线，引发社交媒体的高度关注。 这部游戏到底有多火？根据 2024 国游销量半年榜，该游戏在预售一个月后，销售额达到了 3.9 亿元，销量为 120 万份，大幅打破了国产游戏的预售纪录（原纪录为 10 万级）。 有人将《黑神话：悟空》称为游戏界的「《流浪地球》时刻」，甚至正在全球范围掀起「西游狂潮」。游戏平台 Steam 数据显示，不仅是在中国区，在目前全球热销商品中《黑神话：悟空》都持续霸榜第一名。 图片来源：网页截图预售销量破纪录 尽管还未正式上线，但《黑神话：悟空》已然打破了多项国产主机游戏的纪录。 8 月 19 日，《黑神话：悟空》开启预下载后，Steam 平台下载使用带宽峰值达到了 70Tbps，打破 Steam 纪录。此前，Steam 下载使用带宽峰值纪录由《赛博朋克 2077》在 2020 年底创下，当时为 50Tbps。 比起广泛的关注度，《黑神话：悟空》的销量更为惊人。尽管游戏科学官方并未公布销量数据，但根据多家第三方机构预估，自 6 月 8 日开启预售以来，《黑神话：悟空》全平台销量已达到 120 万，销售额约 3.9 亿元，破国产游戏预售纪录。 与之相对的是，7 月公布的《2024 年 1-6 月中国游戏产业报告》显示，国内上半年主机游戏市场实销收入 7.97 亿元。 此前，《黑神话：悟空》制作人冯骥曾表示，玩家每游玩一个小时，平均所需要的开发成本是 1500 万元~2000 万元人民币。有消息表明，《黑神话：悟空》的游戏时间可能在 20~30 小时左右，以此计算，游戏开发成本在 3 亿元~6 亿元。这意味着，《黑神话：悟空》可能在预售阶段就实现回本。「猴王」未现身，概念股先红 作为国产游戏的扛鼎之作，《黑神话：悟空》的热度也传导至资本市场，华谊兄弟、浙版传媒、中信出版等相关概念股接连上涨。 19 日，华谊兄弟开盘涨停。截至收盘，报 2.47 元 / 股，当日涨幅达 19.9%。华谊兄弟近日在投资者互动平台表示，公司持有英雄互娱 5.17% 股权，后者为《黑神话：悟空》开发商游戏科学的早期投资方。 天眼查显示，2021 年，游戏科学获得腾讯股权投资。变更完成后，腾讯持股 5%，制作人冯骥持股 38.76%，英雄互娱持股 19%。据此推算，华谊兄弟间接持有游戏科学约 1% 的股份。值得注意的是，这些数据仅停留在 2021 年。 根据英雄互娱 2022 年年报，公司已出售游戏科学的股权，并于 2022 年收到第一笔 2.8 亿元的股权转让款，剩余的 2 亿元将在另行协商的时间（不应早于 2025 年 4 月 1 日）支付。根据华谊兄弟 2023 年年报，公司以持有的英雄互娱 5.17% 股权质押取得浙商银行 1.97 亿短期借款。 Choice 数据显示，浙版传媒今年以来累计涨幅约 20%。年内股价最高点出现在 6 月 12 日，也就是《黑神话：悟空》开启预售第三天。此前在 2 月《黑神话：悟空》获批国产游戏版号时，浙版传媒就迎来了一波拉涨。 浙版传媒近日在投资者互动平台表示，公司旗下浙江出版集团数字传媒有限公司是游戏《黑神话：悟空》出版方，负责游戏内容审核、出版申报及出版物号申领工作。 在游戏本体之外，中信出版将参与出版《黑神话：悟空》设定集。游戏设定集一般包含了游戏世界的背景故事、角色设计、物品设定、场景描绘等详细信息，具备收藏价值。考虑到《黑神话：悟空》在美术上的极高表现，机构人士预计游戏热度的攀升也将推动周边商品的销量增长。太火爆！《黑神话：悟空》预售超 4 亿，今日正式上线，A 股概念股已狂飙"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "3",
                        "title": "成都市民拍到 7 个太阳同框，大概 1 分钟后就消失了，你看到了吗？出现这种现象的原因可能是什么？",
                        "shortLink": "26zENb",
                        "properties": {
                            "banner": "https://picx.zhimg.com/80/v2-5eca0e0bc376ff8ca588d0f05e527b68_1440w.webp?source=1def8aca",
                            "metrics": "537 万",
                            "excerpt": "8 月 18 日，四川成都。市民王女士在医院住院部 11 楼，拍到了空中同时出现 7 个太阳的现象。王女士称大概 1 分钟后就消失了，很多人在不同角度都能看到，纷纷观看拍摄，感觉很幸运。19 日，成都气象局气象台工作人员称，正常不会出现这种情况，大概率是光折射和散射引起的。有网友表示，可能是多层玻璃折射，也有人称是云层反射的虚像，你怎么看？成都市民拍到 7 个太阳同框：大概 1 分钟后就消失了"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "4",
                        "title": "我不玩游戏，不太了解为什么《黑神话：悟空》 这么火，谁能帮忙解惑？",
                        "shortLink": "bQVFVj",
                        "properties": {
                            "banner": "https://picx.zhimg.com/80/v2-902e922183812fddcc03926c4e3ac1c4_1440w.webp?source=1def8aca",
                            "metrics": "404 万",
                            "excerpt": "我 90 年生人，今年 34，小时候看人玩小霸王，没钱买，上大学以后电脑也玩不动游戏，所以一直对游戏都不太了解，想问下各位大佬，这个游戏为什么会这么火？背后的原因是什么？ 对于我这种不关注游戏的人都能到处都刷到它，确实挺想了解一下背景"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "5",
                        "title": "《黑神话：悟空》解锁不到 1 小时登 Steam 热玩榜首，同时在线人数突破一百万，为什么它这么火？",
                        "shortLink": "NZBzUf",
                        "properties": {
                            "banner": "https://pic4.zhimg.com/50/v2-84e4f67328e7efc3e8c2610a0c7a44d7_b.jpg",
                            "metrics": "326 万",
                            "excerpt": "[图片]"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "6",
                        "title": "如何评价年轻人「有苦不吃，没福硬享」的人生观和价值观？",
                        "shortLink": "vUJZn2",
                        "properties": {
                            "banner": "https://pic1.zhimg.com/80/v2-a6043fbafbb25d4a728ca8027f56b366_1440w.jpg",
                            "metrics": "226 万",
                            "excerpt": "每当看到年轻人吐槽老一辈，没苦硬吃，有福不享的老一辈生活作风。将勤俭节约和吃苦耐劳形容为感动自己！我就觉得，中华文化当中‘天将降大任于斯人也’可能会在一个群体内结束。当我们过上真正富足的生活后，历史的车轮的再次碾压无可避免。"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "7",
                        "title": "女子在迪士尼排队中途想上厕所，领「厕所卡」获 20 分钟占位，因归队超时需重排崩溃大哭，此设置合理吗？",
                        "shortLink": "ANfyau",
                        "properties": {
                            "banner": "https://pic3.zhimg.com/v2-4ed1fdacd5786d416920fabab31fbe2e_b.jpg",
                            "metrics": "223 万",
                            "excerpt": "近日，一则「女子迪士尼上厕所超时崩溃大哭」的视频在网络引发热议。视频中，一名女子在上海迪士尼乐园排队游玩项目时，因中途上厕所超过「厕所卡」规定的 20 分钟时限，被要求重新排队，女子情绪激动，与工作人员发生争执后崩溃大哭。 事件一出，网友们纷纷发表看法，观点呈现两极分化。一部分网友对女子的遭遇表示同情，认为 20 分钟的「厕所卡」时限过于苛刻，尤其是在人流量巨大的迪士尼乐园，上厕所也需要排队等候，20 分钟难以保证；也有网友认为女子在明知有限时的情况下依然选择中途离开队伍，应该对超时后果有所预料，工作人员只是按规定办事，并无不妥。 「厕所卡」制度的初衷是为了维护排队秩序，保障大多数游客的游玩体验，这一点毋庸置疑。 但在实际操作中，20 分钟的时限是否合理，是否考虑到了游客的实际情况，例如女性、老人、小孩等特殊群体的生理需求，以及园区内厕所分布、排队情况等客观因素，这些都需要迪士尼方面进行考量和完善。 游客也应该提高规则意识，合理安排时间，预估潜在风险。 在明知有限时的情况下，可以选择错峰如厕，或与同行伙伴沟通好，避免超时带来的不便。同时，也应该对园区工作人员多一些理解和包容，毕竟他们也是在履行职责。女子迪士尼上厕所超时崩溃大哭，发放了厕所卡，限时 20 分钟 _ 游客 _ 时限 _ 网友"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "8",
                        "title": "女子抱娃走进兵马俑坑，官方回应「孩子发烧，不得已为之」，如何看待此事？",
                        "shortLink": "BrYRFb",
                        "properties": {
                            "banner": "https://pic3.zhimg.com/50/v2-180bb7872db2c56ecc5401dfe79d8e92_b.jpg",
                            "metrics": "219 万",
                            "excerpt": "8 月 17 日，有网友在社交平台发布视频称，其在陕西游览秦始皇陵兵马俑时，一女子怀抱孩子突然跨过护栏，走在兵马俑坑的坑道边上。 ▲网传视频截图 相关视频中，不时有周围游客发出惊呼：「这太狠了，下俑坑了!」「哎哟，往哪走?」该女子最终走到保安面前，在越过几个土坎后，被保安带离。 ▲网传视频截图 17 日晚，红星新闻记者从西安市临潼区权威部门了解到，事发当天景区附近降雨，女子怀中的小孩被雨淋湿后发烧抽搐。「当时孩子出现这种情况后家长特别着急，一号坑内游客特别多，她也一时出不去，情急之下就进去了。保安在现场发现后询问了情况，因为孩子生病情况比较紧急，就赶紧让家长先把孩子送去救治了。」 红星新闻记者 钟梦哲 罗梦婕女子抱娃走进兵马俑坑 官方：孩子发烧 不得已为之 _ 视频 _ 钟梦哲 _ 秦始皇陵"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "9",
                        "title": "普京明确表态，在乌克兰袭击乃至入侵库尔斯克州后，任何谈判都不可能，这对目前局势有何影响？",
                        "shortLink": "zuuUvu",
                        "properties": {
                            "banner": "https://pic2.zhimg.com/50/v2-ca09e536012d7fb9a737d5c763524ca5_b.jpg",
                            "metrics": "116 万",
                            "excerpt": "当地时间 8 月 19 日，俄罗斯外交部长拉夫罗夫在接受全俄国家电视广播公司采访时谈及俄乌谈判问题。拉夫罗夫表示，俄罗斯总统普京明确表态过，在乌克兰对库尔斯克州进行袭击乃至入侵后，任何谈判都是不可能的。拉夫罗夫称，普京总统还说了一句非常重要的话，即「我们一定会在之后对这一局势做出评估」。 拉夫罗夫否认了近期相关传闻，包括在卡塔尔的斡旋下，俄罗斯与乌克兰就开展能源设施议题的谈判进行了秘密接触，以及土耳其正计划以某种方式试图在粮食安全领域进行斡旋，但前提是确保黑海的航行自由。 乌克兰军队本月 6 日起对俄罗斯库尔斯克州发动袭击，随后双方在该州爆发激烈冲突。俄罗斯总统普京 12 日就俄南部边境局势召开会议时表示，俄方将坚决回应乌方在边境地区的一系列挑衅。 俄外交部：乌方无视俄方善意 俄不会与乌对话 针对美国《华盛顿邮报》报道称，乌克兰武装部队对俄库尔斯克州的袭击破坏了俄乌计划在卡塔尔就避免打击关键基础设施进行的间接会谈，当地时间 18 日，俄罗斯外交部发言人扎哈罗娃表示，没有人破坏任何事情，因为没有事情可以破坏。不管是过去还是现在，俄罗斯与基辅当局都没有就民用关键基础设施的安全问题进行直接或间接谈判。 扎哈罗娃指出，对包括扎波罗热核电站和库尔斯克核电站等设施构成安全威胁的，是乌克兰武装部队的行动以及美国和其他西方国家的共谋。 扎哈罗娃认为，乌克兰方面曾多次有机会通过谈判解决危机，最近一次是在今年 6 月俄罗斯总统普京提出和平倡议之后。但是，在 8 月 6 日乌武装部队对库尔斯克州发动袭击后，全世界都看到了乌克兰对俄方这一善意姿态的回应。扎哈罗娃说，「正如总统普京所说，与做这种事的人没什么好谈的」。 今年 6 月，俄总统普京在一次与俄外交部领导层的会议上提出，俄方随时乐于与乌方就乌克兰问题进行谈判。但是普京表示，谈判的前提条件是乌军从顿涅茨克、卢甘斯克、赫尔松和扎波罗热这四个地区全面撤军。乌克兰撤军后，俄方将立即停火，随后双方开启谈判，包括有关乌克兰不加入北约相关问题。但是普京补充说，乌克兰应当独立作出决定。 随后，乌克兰总统办公室主任顾问波多利亚克回应称，普京没有提出真正的和平建议，也没有结束战争的意愿。乌克兰外交部也表示，普京实际上提出的是最后通牒，旨在误导国际社会，破坏以《联合国宪章》为指导的世界大多数国家的团结。乌克兰总统泽连斯基也表示，普京所谓的停火提议是「不可信任的最后通牒」，其所传达的信息与过去没有什么不同。 俄罗斯外交部长拉夫罗夫当地时间 19 日接受俄媒采访时表示， 拉夫罗夫还称，美国的表态已经说明问题，他们先是说乌克兰袭击库尔斯克州与他们无关，后又说乌克兰人找过他们，但他们并未同意乌方的决定。俄罗斯最新表态：任何谈判都不可能！"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "10",
                        "title": "《黑神话：悟空》在一些媒体评测中被认为本地化翻译或有缺陷，你如何看待国产游戏在海外市场的难点？",
                        "shortLink": "reYfey",
                        "properties": {
                            "banner": "https://pic1.zhimg.com/80/v2-5df10bee11aa775dbcf06e9b8df4d480_1440w.webp?source=1def8aca",
                            "metrics": "112 万",
                            "excerpt": "近期，国产游戏《黑神话：悟空》备受瞩目。该游戏于 8 月 16 日解禁了媒体评价，受到了许多参与试玩的玩家的好评。IGN 给出了 8 分的评价，认为游戏科学公司的首款动作游戏在整体上是成功的。然而，技术层面上的问题和本地化翻译的缺陷可能会对玩家的游戏体验产生影响。但是，游戏的战斗系统非常出色，并巧妙地平衡了资源管理与快节奏反应操作之间的关系。 《黑神话：悟空》中充满了令人兴奋的头目战、丰富多样的敌人以及赏心悦目的世界场景，给玩家带来了极佳的视觉和听觉享受。故事情节也有亮点，但需要玩家了解《西游记》故事背景才能更好地理解。 GS 给出了相同的 8 分评价，在评价中指出，《黑神话：悟空》虽然参差不齐，但亮点往往多于不足。游戏中令人振奋的头目战、快节奏的战斗以及设计出乎意料也令人耳目一新的核心设计都是游戏的优点。虽然在史诗般的战斗之外，游戏体验略显平淡，但能够设计出如此引人入胜的头目战并避免让玩家感到疲惫确实值得称赞。 《黑神话：悟空》于 8 月 20 日正式上架销售。"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "11",
                        "title": "近期人民币汇率出现了爆发式升值，背后的原因是什么？人民币对美元还有多少升值空间？",
                        "shortLink": "RjiAVr",
                        "properties": {
                            "banner": "https://pic1.zhimg.com/50/v2-936a7d89a3a26e3ff50df93249c176d4_b.jpg",
                            "metrics": "104 万",
                            "excerpt": "8 月 19 日下午，离岸人民币兑美元升值超 300 点。近期，人民币汇率出现了爆发式升值，背后的主要诱因是什么？接下来还会进一步加速升值吗？将主要取决于哪些因素？人民币对美元还有多少升值空间？详见：刚刚，人民币爆拉超 300 点！发生了什么？ - 21 财经"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "12",
                        "title": "有史以来第一次，每块金条价值超过 100 万美元，金价持续上涨原因有哪些？后续走势如何？",
                        "shortLink": "fqaMFr",
                        "properties": {
                            "banner": "https://pic1.zhimg.com/80/v2-37d1b0882a171aa8d4430dea56cb608c_1440w.webp?source=1def8aca",
                            "metrics": "96 万",
                            "excerpt": "有史以来第一次，每块金条的价值突破了 100 万美元。上周五黄金市场达到了这个里程碑，当时黄金现货价格突破每盎司 2500 美元，创下历史新高。据伦敦金银市场协会（LBMA），伦敦市场的金条重量通常为 400 盎司左右，能包含 350-430 盎司的纯金。历史首次，每块金条价值超过 100 万美元"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "13",
                        "title": "为什么十天了，俄军还没有收复失地?",
                        "shortLink": "reEb2i",
                        "properties": {
                            "banner": "https://pic2.zhimg.com/50/v2-d080e6a3a38613e2384fed5948ca3699_b.jpg",
                            "metrics": "94 万",
                            "excerpt": "据新华社报道，乌克兰军队 8 月 6 日突袭俄罗斯本土库尔斯克州，随后双方在该州爆发激烈冲突。俄国防部 11 日表示，俄武装力量正在继续回击乌军对俄领土的进攻。 俄罗斯总统普京 12 日说，乌克兰方面对俄罗斯本土发起的袭击旨在提升乌方在谈判中的地位，俄方将对袭击予以坚决回应。 专家分析称，乌克兰方面想要通过此种军事行动打破战场僵局，在战场上获得更多主动性，同时获得更多国际援助，然而这恐将不利于双方和平谈判。当前国际社会需要凝聚合力推动局势降温，为俄乌重启和谈创造条件。乌军突袭俄本土，有何用意？ - 新京报"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "14",
                        "title": "如何评价「咒术回战」还有 5 话即将完结？",
                        "shortLink": "N32UBf",
                        "properties": {
                            "banner": "https://picx.zhimg.com/80/v2-74f371b44aea7793144e8e866059da69_1440w.webp?source=1def8aca",
                            "metrics": "93 万",
                            "excerpt": "8 月 19 日，作者芥见下下表示咒术回战还有 5 话结束，之前作者曾表示今年内完结，按照日期的话，应该是 9 月 30 日结束，对于这部漫画，你有什么想说的？"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "15",
                        "title": "国货电子产品是什么时候开始摆脱「山寨」的偏见，成为大众认知中「好用不贵」的代表的？",
                        "shortLink": "rYNzQr",
                        "properties": {
                            "banner": "https://pic3.zhimg.com/50/v2-d3a8e06de311d1857920fae7a6866c2a_b.jpg",
                            "metrics": "78 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "16",
                        "title": "印度女实习医生被奸杀引发百万医生全国大罢工，这起事件背后反映了印度社会哪些深层次的问题？",
                        "shortLink": "BBvQ7b",
                        "properties": {
                            "banner": "https://picx.zhimg.com/80/v2-156afdd55f805e1e06a6f94643b0c8ee_720w.png",
                            "metrics": "78 万",
                            "excerpt": "印度女实习医生被奸杀引发百万医生“全国大罢工印度女实习医生被奸杀引发百万医生「全国大罢工」"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "17",
                        "title": "除吕布，夏侯渊，黄忠之外，演义中还有没有弓术卓越的？",
                        "shortLink": "FzAVZb",
                        "properties": {
                            "banner": "https://pic1.zhimg.com/50/v2-ea5181d362b2ef3f486c8966a115ca90_b.jpg",
                            "metrics": "77 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "18",
                        "title": "对学生而言，有哪些「买了也吃灰，用了就踩雷」的学习工具？",
                        "shortLink": "BfmInm",
                        "properties": {
                            "banner": "https://picx.zhimg.com/80/v2-ce1e213f6e0c60c9a37e37e4f7c4dedf_1440w.webp?source=1def8aca",
                            "metrics": "74 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "19",
                        "title": "儿童几岁容易近视？",
                        "shortLink": "aIveqa",
                        "properties": {
                            "banner": "https://pic1.zhimg.com/50/v2-6f896ef1a7c168e65e864d6bf752ca68_b.jpg",
                            "metrics": "74 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "20",
                        "title": "我们普通人真的有必要学习科普类知识吗？多学习科普知识对我们的生活有什么好处？",
                        "shortLink": "zUfMRv",
                        "properties": {
                            "banner": "https://zchengb-images.oss-cn-shenzhen.aliyuncs.com/1.jpeg",
                            "metrics": "73 万",
                            "excerpt": "近期身边很多朋友都在关注一些科普类的知识，我也觉得偶尔看一些科普类的知识挺有好处的，起码见多识广。"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "21",
                        "title": "双 985 硕士女生要不要回潍坊?",
                        "shortLink": "EnueIn",
                        "properties": {
                            "banner": "https://zchengb-images.oss-cn-shenzhen.aliyuncs.com/1.jpeg",
                            "metrics": "71 万",
                            "excerpt": "学的产品设计，研一在读，过年回家被问工作将来在哪的问题，目前还是挺迷茫的。回潍坊无非就是去大专当教师和歌尔潍柴，想问问这两条路值得去吗，或者有没有更好的选择（能用 985 的名头沾光一点的）"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "22",
                        "title": "迟早都会分开，那还为什么要相遇?",
                        "shortLink": "MNVJRn",
                        "properties": {
                            "banner": "https://zchengb-images.oss-cn-shenzhen.aliyuncs.com/1.jpeg",
                            "metrics": "67 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "23",
                        "title": "除了自燃，新能源汽车还存在哪些安全隐患？",
                        "shortLink": "mUJnMv",
                        "properties": {
                            "banner": "https://pic2.zhimg.com/50/v2-51ce2ec73e14a3e97f970933138cc641_b.jpg",
                            "metrics": "64 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "24",
                        "title": "如何让孩子有一个快乐的童年？",
                        "shortLink": "Jz6Nfu",
                        "properties": {
                            "banner": "https://zchengb-images.oss-cn-shenzhen.aliyuncs.com/1.jpeg",
                            "metrics": "64 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "25",
                        "title": "爱情中的「自恋」，对未来感情将有何影响？",
                        "shortLink": "2yM7Nz",
                        "properties": {
                            "banner": "https://pic2.zhimg.com/50/v2-f173f2d0bfa1749ffe5a0b701fc7f881_b.jpg",
                            "metrics": "61 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "26",
                        "title": "给你 1000 万让你与你的前任结婚你愿意吗？",
                        "shortLink": "BNnyEz",
                        "properties": {
                            "banner": "https://zchengb-images.oss-cn-shenzhen.aliyuncs.com/1.jpeg",
                            "metrics": "59 万",
                            "excerpt": "给你 1000 万让你与你的前任结婚你愿意吗？ | 我相信很多人都不只一个前任吧。如果给你 1000 万，让你与曾经伤害你最深的那个前任结婚，你还愿意吗？没有前任的就不用回答了。都是伤害前任的也不用回答了。如果你觉得 1000 万不够你觉得多少可以就接受？"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "27",
                        "title": "不考虑预算的话，2024 有哪些品牌的遊戲手柄值得推荐？",
                        "shortLink": "2YJ7Rb",
                        "properties": {
                            "banner": "https://pic1.zhimg.com/50/v2-3cf27fe8b2817df1ba3b18dc728cf920_b.jpg",
                            "metrics": "59 万",
                            "excerpt": "不考虑价钱的話應該買哪款？已经有 Xbox series 的想升级，謝謝"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "28",
                        "title": "哪个小事让你真正体会到了中国智造的「遥遥领先」？",
                        "shortLink": "UB3Qji",
                        "properties": {
                            "banner": "https://pic2.zhimg.com/50/v2-062b97c30a102b84d86397a5ce390e65_b.jpg",
                            "metrics": "59 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "29",
                        "title": "为什么把个锐司（Greece）的首都 Athens 音译成「雅典」而不是「阿森司」？",
                        "shortLink": "Ufa6Jn",
                        "properties": {
                            "banner": "https://zchengb-images.oss-cn-shenzhen.aliyuncs.com/1.jpeg",
                            "metrics": "58 万",
                            "excerpt": ""
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    },
                    {
                        "rankNum": "30",
                        "title": "《庆余年》太子演员张昊唯被曝逃税、组织卖淫，张昊唯方回应清者自清，真实情况如何？此事暴露出哪些问题？",
                        "shortLink": "fQ7VFf",
                        "properties": {
                            "banner": "https://pic3.zhimg.com/50/v2-c0b3c07d5bed9a2fba2bad560e3364da_b.jpg",
                            "metrics": "58 万",
                            "excerpt": "最新进展 张昊唯工作室就此事做出回应： 首先我们对占用公共资源向广大网友道歉，也非常感谢大家对本司艺人的关心! 对网上曝光的几个问题我们做出以下几点声明:1 在税务问题上我们一直本着合理合法纳税的原则，绝对没有任何的偷税漏税行为，税务的完税证明我们已经发出，清者自清请广大网友监督。2 关于视频录音等爆料的真实性后续相信公安机关会给出一个公正的结果，此事牵扯到一个刑事案件，早在一周前我们已经报警，等待后续的处理结果，因案件正在受理办理中一些细节我们现在不便公开，相信公安部门会给出一个公证的结果。被爆涉嫌税务问题和不当言论，《庆余年》演员张昊唯官方回应：清者自清 | 极目新闻 中央戏剧学院表演系优秀本科班，与郭麒麟搭档出演爆款剧《庆余年》中太子李承乾一角的张昊唯, 前段时间因为爆料的事情, 向戴向宇公开道歉，口无遮拦的他这回又摊上大事儿了。 从他与朋友的聊天记录截图中不难看到「培养妈咪」「笼络天南地北小姐」「整合头部资源」等虎狼之词如若当真，非同小可。从法律层面讲，组织卖淫罪相比卖淫嫖娼要严重的多。也许，这是他酒后吹吹牛 X，装比当大佬儿，但尺度之大，令人咋舌。 娱乐圈就是名利场，除了色，还有利。 从截图内容看，张昊唯涉嫌做假账和逃税。近些年来，明星的负面新闻大致可分为「嫖娼组」和「逃税组」，牵着涉及到王全安、李云迪、李易峰、王力宏、罗志祥等，组成了阵容强大的「男星组合」，而毛阿敏、范冰冰、郑爽、薇娅、宋祖儿、袁冰妍等组成的偷税组「女子天团」丝毫不逊色。但是，像张昊唯这样两条腿分踩两条船的明星的确罕见。 与上述前辈们相比，张昊唯的名气与收入不值一提，但「交 100 万，返 50 万」的操作实属炸裂。百万利税在普通网友眼里已是天价, 又够我们奋斗多少年呢？ 《庆余年》太子演员被曝逃税 还称其与「妈咪」合作「猎艳」"
                        },
                        "acquisitionTime": "2024-08-20 13:52:52"
                    }
                ],
                "doubanMovie": [
                    {
                        "name": "因果报应",
                        "shortLink": "aaaauu",
                        "type": "剧情 动作 惊悚 犯罪",
                        "region": "印度",
                        "publishDate": "2024-06-14",
                        "rate": "8.4",
                        "rankState": "UP",
                        "rankNum": "1",
                        "rankingChange": "5",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2909638286.jpg"
                    },
                    {
                        "name": "同意",
                        "shortLink": "QBneyu",
                        "type": "剧情 传记",
                        "region": "法国 比利时",
                        "publishDate": "2023-10-11",
                        "rate": "7.3",
                        "rankState": "UP",
                        "rankNum": "2",
                        "rankingChange": "9",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2896128093.jpg"
                    },
                    {
                        "name": "再见，朱莉娅",
                        "shortLink": "faqmei",
                        "type": "剧情",
                        "region": "苏丹 瑞典 德国 沙特阿拉伯",
                        "publishDate": "2023-05-20",
                        "rate": "8.3",
                        "rankState": "UP",
                        "rankNum": "3",
                        "rankingChange": "1",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2891707171.jpg"
                    },
                    {
                        "name": "珠峰女王：拉克帕·夏尔巴",
                        "shortLink": "7Nb6rm",
                        "type": "纪录片",
                        "region": "美国",
                        "publishDate": "2023-09-10",
                        "rate": "8.6",
                        "rankState": "UP",
                        "rankNum": "4",
                        "rankingChange": "7",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2911909225.jpg"
                    },
                    {
                        "name": "从21世纪安全撤离",
                        "shortLink": "nqeIja",
                        "type": "喜剧 科幻",
                        "region": "中国大陆",
                        "publishDate": "2024-08-02",
                        "rate": "7.6",
                        "rankState": "DOWN",
                        "rankNum": "5",
                        "rankingChange": "2",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2911256273.jpg"
                    },
                    {
                        "name": "过季",
                        "shortLink": "M3UbMb",
                        "type": "剧情",
                        "region": "法国",
                        "publishDate": "2023-09-08",
                        "rate": "7.3",
                        "rankState": "UP",
                        "rankNum": "6",
                        "rankingChange": "3",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2903861167.jpg"
                    },
                    {
                        "name": "负负得正",
                        "shortLink": "IrAVBf",
                        "type": "剧情 爱情",
                        "region": "中国大陆",
                        "publishDate": "2024-08-10",
                        "rate": "7.0",
                        "rankState": "UP",
                        "rankNum": "7",
                        "rankingChange": "4",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2911225735.jpg"
                    },
                    {
                        "name": "白蛇：浮生",
                        "shortLink": "eaUFbq",
                        "type": "喜剧 爱情 动画 奇幻",
                        "region": "中国大陆",
                        "publishDate": "2024-08-10",
                        "rate": "7.1",
                        "rankState": "UP",
                        "rankNum": "8",
                        "rankingChange": "3",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2911337432.jpg"
                    },
                    {
                        "name": "一杯咖啡与新穿的鞋子",
                        "shortLink": "F3iEVb",
                        "type": "剧情",
                        "region": "阿尔巴尼亚 希腊 科索沃 葡萄牙",
                        "publishDate": "2022-11-21",
                        "rate": "7.1",
                        "rankState": "UP",
                        "rankNum": "9",
                        "rankingChange": "2",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2890841513.jpg"
                    },
                    {
                        "name": "名侦探柯南：百万美元的五棱星",
                        "shortLink": "VjeYvq",
                        "type": "动画 悬疑 犯罪",
                        "region": "日本",
                        "publishDate": "2024-04-12",
                        "rate": "7.0",
                        "rankState": "UP",
                        "rankNum": "10",
                        "rankingChange": "1",
                        "coverUrl": "https://tops-resources.oss-cn-hangzhou.aliyuncs.com/p2911723556.jpg"
                    }
                ],
                "sspai": [
                    {
                        "title": "不等一个阳光明媚的晴天，让这些电影带你去海边",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 7,
                        "commentCount": 3,
                        "publishDate": "08月20日",
                        "shortLink": "3MNnM3",
                        "morningPaper": false
                    },
                    {
                        "title": "派早报：Procreate 明确拒绝生成式 AI，网易云音乐发生服务器故障等",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 12,
                        "commentCount": 18,
                        "publishDate": "08月20日",
                        "shortLink": "eiyUjy",
                        "morningPaper": true
                    },
                    {
                        "title": "派评 | 近期值得关注的 App",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 9,
                        "commentCount": 7,
                        "publishDate": "08月19日",
                        "shortLink": "i2qQju",
                        "morningPaper": false
                    },
                    {
                        "title": "八个月里数台数码新品，我们用「众测」发现了骁龙芯片的更多惊喜",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 6,
                        "commentCount": 0,
                        "publishDate": "08月19日",
                        "shortLink": "jqEBRf",
                        "morningPaper": false
                    },
                    {
                        "title": "寻源大圣：黑神话悟空背后的民俗及文化起源",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 47,
                        "commentCount": 11,
                        "publishDate": "08月19日",
                        "shortLink": "yEzYrm",
                        "morningPaper": false
                    },
                    {
                        "title": "让 AI 给新闻把把关：基于 Tasker 的资讯过滤与播报",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 37,
                        "commentCount": 18,
                        "publishDate": "08月19日",
                        "shortLink": "m6zmEr",
                        "morningPaper": false
                    },
                    {
                        "title": "派早报：《堡垒之夜》通过 Epic 商店重返 iOS",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 6,
                        "commentCount": 48,
                        "publishDate": "08月19日",
                        "shortLink": "Jn6Vbi",
                        "morningPaper": true
                    },
                    {
                        "title": "不买可以先收藏 15：如何做一锅好吃的米饭",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 133,
                        "commentCount": 63,
                        "publishDate": "08月18日",
                        "shortLink": "vIBnem",
                        "morningPaper": false
                    },
                    {
                        "title": "从游泳、骑行到跑步：浅析奥运金牌背后的科技变革",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 28,
                        "commentCount": 12,
                        "publishDate": "08月17日",
                        "shortLink": "jUvIRr",
                        "morningPaper": false
                    },
                    {
                        "title": "《黑神话：悟空》评测：敢问路在何方，路在脚下",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 54,
                        "commentCount": 30,
                        "publishDate": "08月17日",
                        "shortLink": "n2aeYr",
                        "morningPaper": false
                    },
                    {
                        "title": "本周看什么 | 最近值得一看的 7 部作品",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 11,
                        "commentCount": 16,
                        "publishDate": "08月16日",
                        "shortLink": "6NrM7b",
                        "morningPaper": false
                    },
                    {
                        "title": "新玩意 191｜少数派的编辑们最近买了啥？",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 34,
                        "commentCount": 47,
                        "publishDate": "08月15日",
                        "shortLink": "VVvuyy",
                        "morningPaper": false
                    },
                    {
                        "title": "不当赛博文盲，N 个常见问题解决方案不求人",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 61,
                        "commentCount": 34,
                        "publishDate": "08月15日",
                        "shortLink": "e67jey",
                        "morningPaper": false
                    },
                    {
                        "title": "一台更实用的「iPhone」：小米 14 半年体验",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 47,
                        "commentCount": 80,
                        "publishDate": "08月14日",
                        "shortLink": "AvAreq",
                        "morningPaper": false
                    },
                    {
                        "title": "派评 | 近期值得关注的 App",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 11,
                        "commentCount": 26,
                        "publishDate": "08月12日",
                        "shortLink": "qE3YJz",
                        "morningPaper": false
                    },
                    {
                        "title": "我心中的巴黎奥运会之最——一个线上观众的时差两周的盘点",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 36,
                        "commentCount": 24,
                        "publishDate": "08月12日",
                        "shortLink": "Iv6BZ3",
                        "morningPaper": false
                    },
                    {
                        "title": "Mac 版虽迟但到：老牌阅读器 Unread 推出 4.0 大更新",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 16,
                        "commentCount": 26,
                        "publishDate": "08月11日",
                        "shortLink": "BNRNzm",
                        "morningPaper": false
                    },
                    {
                        "title": "本周看什么 | 最近值得一看的 8 部作品",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 20,
                        "commentCount": 6,
                        "publishDate": "08月09日",
                        "shortLink": "neiAbi",
                        "morningPaper": false
                    },
                    {
                        "title": "消费降级以后，我做了这款APP提醒我物尽其用",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 11,
                        "commentCount": 27,
                        "publishDate": "08月09日",
                        "shortLink": "rQRvim",
                        "morningPaper": false
                    },
                    {
                        "title": "心中无工作天天放假，手边有鱼摸劳逸结合",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 107,
                        "commentCount": 34,
                        "publishDate": "08月08日",
                        "shortLink": "6bIFnq",
                        "morningPaper": false
                    },
                    {
                        "title": "4 年 223 场演出，为你总结这份 Livehouse 观演指南",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 58,
                        "commentCount": 21,
                        "publishDate": "08月08日",
                        "shortLink": "ya2URb",
                        "morningPaper": false
                    },
                    {
                        "title": "一日一技 | 手机不支持内录？用 Reaper 四步抢救录音效果",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 23,
                        "commentCount": 4,
                        "publishDate": "08月08日",
                        "shortLink": "IfI3Ev",
                        "morningPaper": false
                    },
                    {
                        "title": "有争议，无悬念：我的一年期 MacBook Pro使用记录与随想",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 70,
                        "commentCount": 129,
                        "publishDate": "08月06日",
                        "shortLink": "JRRJBz",
                        "morningPaper": false
                    },
                    {
                        "title": "老是错过提醒通知？这个强提醒 App 可能适合你",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 7,
                        "commentCount": 41,
                        "publishDate": "08月06日",
                        "shortLink": "NN3Uj2",
                        "morningPaper": false
                    },
                    {
                        "title": "派评 | 近期值得关注的 App",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 39,
                        "commentCount": 28,
                        "publishDate": "08月05日",
                        "shortLink": "EnQ3ee",
                        "morningPaper": false
                    },
                    {
                        "title": "本周看什么 | 最近值得一看的 8 部作品",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 24,
                        "commentCount": 9,
                        "publishDate": "08月02日",
                        "shortLink": "Y3yaYr",
                        "morningPaper": false
                    },
                    {
                        "title": "七夕送礼不抓狂，这是派商店为你准备的送礼清单",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 12,
                        "commentCount": 34,
                        "publishDate": "08月02日",
                        "shortLink": "ZJrEna",
                        "morningPaper": false
                    },
                    {
                        "title": "2024 年，我是如何使用 Windows PC 的",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 339,
                        "commentCount": 134,
                        "publishDate": "08月02日",
                        "shortLink": "NvU73m",
                        "morningPaper": false
                    },
                    {
                        "title": "重新认识读书这件小事：谈我的「读书之道」",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 45,
                        "commentCount": 6,
                        "publishDate": "07月31日",
                        "shortLink": "F7VZVr",
                        "morningPaper": false
                    },
                    {
                        "title": "用Notion搭建人生操作系统",
                        "banner": "file:///Users/zchengb/Downloads/75eb9a4e-b964-c930-0df3-ab4f7025b6a3.png",
                        "likeCount": 38,
                        "commentCount": 25,
                        "publishDate": "07月30日",
                        "shortLink": "f6VjIv",
                        "morningPaper": false
                    }
                ],
                "xiaoyuzhou": [
                    {
                        "title": "谷歌被判垄断搜索市场，历史性的裁决将带来哪些影响？",
                        "author": "声动早咖啡",
                        "duration": 3669,
                        "mediaUrl": "file:///Users/zchengb/Desktop/data/music/music_1.mp3",
                        "coverUrl": "file:///Users/zchengb/Desktop/aHR0cHM6Ly9pbWFnZS54eXpjZG4ubmV0L0ZubkU4MzNublhJZjduRkdQOUtja1FjS0dXS0YucG5n.png@thumbnail",
                        "trendType": "最热榜"
                    },
                    {
                        "title": "🇹🇭 “泰”夸张了！他信家族出第四位泰国总理了🔋越来越贵的共享充电宝，其实也挺难的",
                        "author": "油条配咖啡YwC",
                        "duration": 727,
                        "mediaUrl": "https://media.xyzcdn.net/ltV2kETGEzzVwQ6WmxPVQ4yRenr1.m4a",
                        "coverUrl": "file:///Users/zchengb/Desktop/aHR0cHM6Ly9pbWFnZS54eXpjZG4ubmV0L0ZubkU4MzNublhJZjduRkdQOUtja1FjS0dXS0YucG5n.png@thumbnail",
                        "trendType": "锋芒榜"
                    },
                    {
                        "title": "马薇薇对话陈海贤（下集）：抑郁是人生的新希望",
                        "author": "一块心病",
                        "duration": 2161,
                        "mediaUrl": "https://media.xyzcdn.net/lhBYEpHs4ci0b4MltRDfkcM-Z3U7.m4a",
                        "coverUrl": "file:///Users/zchengb/Desktop/aHR0cHM6Ly9pbWFnZS54eXpjZG4ubmV0L0ZubkU4MzNublhJZjduRkdQOUtja1FjS0dXS0YucG5n.png@thumbnail",
                        "trendType": "新星榜"
                    },
                    {
                        "title": "职场向上管理，小小领导，拿捏～｜VOL.139",
                        "author": "肥话连篇",
                        "duration": 4761,
                        "mediaUrl": "https://media.xyzcdn.net/lnD6PB45T44iHULJNBdamMyWQgBs.m4a",
                        "coverUrl": "file:///Users/zchengb/Desktop/aHR0cHM6Ly9pbWFnZS54eXpjZG4ubmV0L0ZubkU4MzNublhJZjduRkdQOUtja1FjS0dXS0YucG5n.png@thumbnail",
                        "trendType": "最热榜"
                    },
                    {
                        "title": "Vol.97 这些扫兴鬼，撕烂你的嘴",
                        "author": "朋嗑儿",
                        "duration": 4441,
                        "mediaUrl": "https://media.xyzcdn.net/llk9cBduKayoZXFqe4lEI2VZa71W.m4a",
                        "coverUrl": "file:///Users/zchengb/Desktop/aHR0cHM6Ly9pbWFnZS54eXpjZG4ubmV0L0ZubkU4MzNublhJZjduRkdQOUtja1FjS0dXS0YucG5n.png@thumbnail",
                        "trendType": "锋芒榜"
                    },
                    {
                        "title": "Ep3.炸平一切的复仇：河北石家庄“3·16”爆炸案",
                        "author": "只有猫知道CatsKnow",
                        "duration": 2934,
                        "mediaUrl": "https://media.xyzcdn.net/luP3X2-8QrnkD7nnqgR5X5gkUIVf.m4a",
                        "coverUrl": "file:///Users/zchengb/Desktop/aHR0cHM6Ly9pbWFnZS54eXpjZG4ubmV0L0ZubkU4MzNublhJZjduRkdQOUtja1FjS0dXS0YucG5n.png@thumbnail",
                        "trendType": "新星榜"
                    }
                ],
                "sina": [
                    {
                        "rankNum": "1",
                        "title": "黑神话悟空",
                        "shortLink": "EJbyYj",
                        "properties": {
                            "viewers": "2951971"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "2",
                        "title": "以色列暴发疫情",
                        "shortLink": "NZj2aa",
                        "properties": {
                            "viewers": "2753716"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "3",
                        "title": "2024中国丰收图景",
                        "shortLink": "U3E7re",
                        "properties": {
                            "viewers": "2276170"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "4",
                        "title": "张昊唯和三个人被拍到三次",
                        "shortLink": "INJBNb",
                        "properties": {
                            "viewers": "2275833"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "5",
                        "title": "金晨男友",
                        "shortLink": "qUJNbq",
                        "properties": {
                            "viewers": "2216475"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "6",
                        "title": "二郎神 张翰",
                        "shortLink": "eY7Vze",
                        "properties": {
                            "viewers": "1715609"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "7",
                        "title": "女流直播间被封",
                        "shortLink": "BJ7vay",
                        "properties": {
                            "viewers": "1021852"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "8",
                        "title": "网友向雷军举报王腾上班摸鱼",
                        "shortLink": "Bbqeqq",
                        "properties": {
                            "viewers": "995438"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "9",
                        "title": "韩国博主点评黑神话悟空",
                        "shortLink": "Bjaeuy",
                        "properties": {
                            "viewers": "763152"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "10",
                        "title": "葫芦岛暴雨内涝街道泥水汹涌",
                        "shortLink": "FZBFBf",
                        "properties": {
                            "viewers": "708461"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "11",
                        "title": "金晨方声明",
                        "shortLink": "niu26n",
                        "properties": {
                            "viewers": "707924"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "12",
                        "title": "陆虎婚纱照",
                        "shortLink": "67ZZja",
                        "properties": {
                            "viewers": "703631"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "13",
                        "title": "华为阿维塔合资",
                        "shortLink": "VZRnAn",
                        "properties": {
                            "viewers": "628119"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "14",
                        "title": "王楚钦孙颖莎双双保持世界第一",
                        "shortLink": "Y3Y3yu",
                        "properties": {
                            "viewers": "603848"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "15",
                        "title": "辽宁建昌居民非必要不外出",
                        "shortLink": "yAjQBn",
                        "properties": {
                            "viewers": "569705"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "16",
                        "title": "黑神话悟空卡在广智了",
                        "shortLink": "AB3YR3",
                        "properties": {
                            "viewers": "569024"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "17",
                        "title": "中秋节好像没放假又好像放了",
                        "shortLink": "YbIF7r",
                        "properties": {
                            "viewers": "558915"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "18",
                        "title": "泰剧已经把女主进化成这样了么",
                        "shortLink": "bAf6Ff",
                        "properties": {
                            "viewers": "551825"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "19",
                        "title": "完全没有表演痕迹才是最可怕的",
                        "shortLink": "uaymii",
                        "properties": {
                            "viewers": "550458"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "20",
                        "title": "私藏浪漫直播",
                        "shortLink": "mYjmee",
                        "properties": {
                            "viewers": "488545"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "21",
                        "title": "相识一月结婚一周就闹离婚",
                        "shortLink": "mqMFri",
                        "properties": {
                            "viewers": "438998"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "22",
                        "title": "金莎 睡九个小时我就满足",
                        "shortLink": "uI3E7r",
                        "properties": {
                            "viewers": "409506"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "23",
                        "title": "张昊唯说自己喜欢江疏影",
                        "shortLink": "32AVBz",
                        "properties": {
                            "viewers": "402691"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "24",
                        "title": "孙杨复出首站确定在合肥",
                        "shortLink": "7vMBZb",
                        "properties": {
                            "viewers": "333538"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "25",
                        "title": "冯禧去拍戏了",
                        "shortLink": "zMvMZn",
                        "properties": {
                            "viewers": "298116"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "26",
                        "title": "建昌暴雨",
                        "shortLink": "BVj6ny",
                        "properties": {
                            "viewers": "275191"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "27",
                        "title": "A股",
                        "shortLink": "7bmyii",
                        "properties": {
                            "viewers": "271117"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "28",
                        "title": "杨紫费加罗封面",
                        "shortLink": "QBRF3q",
                        "properties": {
                            "viewers": "263009"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "29",
                        "title": "专家称黑神话悟空将撼动中国游戏版图",
                        "shortLink": "vEJJv2",
                        "properties": {
                            "viewers": "254890"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "30",
                        "title": "戴了一个月的金项链变色了",
                        "shortLink": "nEJRbe",
                        "properties": {
                            "viewers": "252286"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "31",
                        "title": "小海绵用Angelababy账号刷直播",
                        "shortLink": "AZrEjy",
                        "properties": {
                            "viewers": "248780"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "32",
                        "title": "中式英语成海外爆梗",
                        "shortLink": "ANZnem",
                        "properties": {
                            "viewers": "245017"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "33",
                        "title": "谁懂魏哲鸣跑过去的这一瞬间",
                        "shortLink": "A3mi2u",
                        "properties": {
                            "viewers": "244379"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "34",
                        "title": "疑似张昊唯曝金晨男友",
                        "shortLink": "6vyMb2",
                        "properties": {
                            "viewers": "243729"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "35",
                        "title": "BLACKPINK或将与霉霉合作",
                        "shortLink": "7nu26n",
                        "properties": {
                            "viewers": "236270"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "36",
                        "title": "黑神话悟空主角天命人商标被抢注",
                        "shortLink": "3Iruqe",
                        "properties": {
                            "viewers": "233723"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "37",
                        "title": "46岁李维嘉洁癖严重",
                        "shortLink": "RreaYz",
                        "properties": {
                            "viewers": "230721"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "38",
                        "title": "KPL梦之队团综官宣定档",
                        "shortLink": "yaEFJj",
                        "properties": {
                            "viewers": "220080"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "39",
                        "title": "为什么只穿袜子比全裸更有羞耻感",
                        "shortLink": "QN77Vn",
                        "properties": {
                            "viewers": "206463"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "40",
                        "title": "王昶梁伟铿将录制你好星期六",
                        "shortLink": "zUnaQz",
                        "properties": {
                            "viewers": "200077"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "41",
                        "title": "上海大楼被回春丹整栋出租",
                        "shortLink": "Rv2E3u",
                        "properties": {
                            "viewers": "195772"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "42",
                        "title": "男朋友为了追我帮我遛狗",
                        "shortLink": "ARv2Ez",
                        "properties": {
                            "viewers": "187768"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "43",
                        "title": "陈飞宇庄达菲的cp感",
                        "shortLink": "Ur6rEf",
                        "properties": {
                            "viewers": "182647"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "44",
                        "title": "黑神话 电脑带不动",
                        "shortLink": "bMZJnq",
                        "properties": {
                            "viewers": "180820"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "45",
                        "title": "晴天小猪作者去世",
                        "shortLink": "BRZn2u",
                        "properties": {
                            "viewers": "174663"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "46",
                        "title": "张大仙全球首吐",
                        "shortLink": "UZRJja",
                        "properties": {
                            "viewers": "172813"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "47",
                        "title": "黑神话悟空腾云出海网友直面天命",
                        "shortLink": "VVZB73",
                        "properties": {
                            "viewers": "167622"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "48",
                        "title": "异形",
                        "shortLink": "fMr6v2",
                        "properties": {
                            "viewers": "167057"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "49",
                        "title": "黑神话悟空 晕3D",
                        "shortLink": "RNnUVr",
                        "properties": {
                            "viewers": "166152"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    },
                    {
                        "rankNum": "50",
                        "title": "十个勤天佛山抢票",
                        "shortLink": "NBZFV3",
                        "properties": {
                            "viewers": "161895"
                        },
                        "acquisitionTime": "2024-08-20 13:53:48"
                    }
                ]
            }
            setGlobalState({...globalState, news: data});
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNews();
        setRefreshing(false);
        console.log('refresh completed.');
    };

    return <SafeAreaView style={styles.container}>
        <Tab
            value={tabIndex}
            onChange={(e) => setTabIndex(e)}
            style={styles.tabBar}
            containerStyle={styles.tarBarContainer}
            indicatorStyle={styles.tabBarIndicator}
            scrollable
        >
            {
                channelList
                    .filter(channel => channel.enable)
                    .map((channel, index) =>
                        <Tab.Item
                            key={index}
                            iconPosition="left"
                            title={channel.tabTitle}
                            titleStyle={tabIndex === index ? styles.selectedTabBarText : styles.tabBarText}
                            icon={channel.icon}
                        />
                    )
            }
        </Tab>

        <TabView value={tabIndex} onChange={setTabIndex} animationType="spring" loading={loading} minSwipeRatio={0}
                 minSwipeSpeed={100}>
            {
                channelList
                    .filter(channel => channel.enable)
                    .map(
                        (channel, index) => {
                            return <TabView.Item style={styles.tabView} key={index}>
                                <ScrollView
                                    contentContainerStyle={styles.scrollView}
                                    refreshControl={
                                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                                    }
                                >
                                    {channel.component}
                                </ScrollView>
                            </TabView.Item>
                        }
                    )
            }
        </TabView>
        <SafeAreaView>
            <PlayerBar />
        </SafeAreaView>
    </SafeAreaView>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingLeft: 4,
        paddingRight: 4
    },
    tabBar: {
        paddingLeft: 4,
        paddingRight: 4,
    },
    tarBarContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 48,
    },
    tabBarIndicator: {
        backgroundColor: '#626262',
        height: 3,
    },
    tabBarText: {
        marginLeft: -16,
        fontSize: 16,
        fontWeight: "normal",
        color: 'rgba(0,0,0,0.85)',
    },
    selectedTabBarText: {
        marginLeft: -16,
        fontSize: 16,
        fontWeight: "bold",
        color: 'rgba(0,0,0,0.85)',
    },
    tabBarIcon: {
        marginRight: 8,
    },
    text: {
        fontSize: 24,
        color: 'black',
        textAlign: 'center',
        marginTop: 20,
    },
    tabView: {
        backgroundColor: '#fffff',
        width: '100%'
    },
    scrollView: {
        flexGrow: 1,
    },
})