import { storage } from "../storage";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export const sendVerificationCode = (email) => {
    return fetch(`${apiUrl}/sign-in-verification-code/email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });
};

export const signIn = (email, verificationCode) => {
    return fetch(`${apiUrl}/user/sign-in`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            verificationCode
        }),
    });
};


export const getUserInfo = () => {
    const accessToken = storage.getString('accessToken');
    if (!accessToken) {
        throw new Error('请先登录');
    }

    return fetch(`${apiUrl}/user/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });
};
