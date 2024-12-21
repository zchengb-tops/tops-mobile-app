import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { useTheme } from '@rneui/themed';
import {useVisibility} from "../providers/VisibilityProvider";

export const UserServiceAgreementScreen = ({ navigation, route }) => {
    const { setIsNavBarVisible } = useVisibility();

    useEffect(() => {
        setIsNavBarVisible(false);
        return () => setIsNavBarVisible(true);
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            route.params?.onGoBack?.();
        });

        return unsubscribe;
    }, [navigation]);

    const { theme } = useTheme();
    
    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]}>用户服务协议</Text>
                
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    欢迎您使用 InfoHub。在使用本应用之前，请您仔细阅读以下条款。使用本应用即表示您同意接受以下所有条款。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>1. 服务说明</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    InfoHub 是一款资讯聚合应用，为用户提供新闻资讯订阅和阅读服务。我们会尽最大努力保证服务的连续性和可用性，但不承诺服务不会中断。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>2. 用户行为规范</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    用户在使用本应用时应遵守中华人民共和国相关法律法规，不得利用本应用从事违法违规活动。用户应对自己在使用本应用过程中的行为负责。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>3. 隐私保护</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    我们重视用户的隐私保护，会采取合理措施保护用户的个人信息安全。我们承诺不会将用户的个人信息用于未经授权的用途。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>4. 内容来源与版权声明</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    本应用提供的资讯内容来自互联网公开信息的人工筛选和整理。我们尊重原创，所有内容均注明来源，版权归原作者所有。如果内容提供方对内容的使用存在异议，可随时通过以下方式与我们联系：
                </Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    • 邮箱：zxchengb@163.com{'\n'}
                    • 应用内反馈功能
                </Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    收到异议通知后，我们将在核实后及时处理，包括但不限于删除相关内容或下架相关频道。
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>5. 免责声明</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    本应用仅作为信息整合平台，不对任何转载内容的准确性、完整性和及时性做出保证。本应用不对任何资讯内容进行商业使用，仅供用户个人学习和参考。
                </Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    对于因以下原因造成的任何损失，本应用不承担任何责任：{'\n'}
                    • 不可抗力或非本应用可控原因导致的服务中断{'\n'}
                    • 第三方内容提供方的行为或内容{'\n'}
                    • 用户自行承担使用本应用的风险
                </Text>

                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>6. 协议修改</Text>
                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    我们保留在必要时修改本协议的权利。对本协议的修改将通过应用内通知或其他适当方式告知用户。
                </Text>

                <Text style={[styles.paragraph, { color: theme.colors.text }]}>
                    如您对本协议有任何疑问，请通过应用内的反馈功能与我们联系。
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 15,
    },
});
