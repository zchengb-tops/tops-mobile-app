import {request} from "../request";

export const sendVerificationCode = (email) => {
    return request('/sign-in-verification-code/email', {
        method: 'POST',
        body: { email }
    });
};

export const signIn = (email, verificationCode) => {
    return request('/user/sign-in', {
        method: 'POST',
        body: {
            email,
            verificationCode
        }
    });
};

export const getUserInfo = () => {
    return request('/user/me', {
        method: 'GET'
    });
};


export const getUserNewsChannelConfig = () => {
    return request('/user/news-channel-config', {
        method: 'GET'
    });
};

export const getUserNewsChannelConfigCurrentVersion = () => {
    return request('/user/news-channel-config/version', {
        method: 'GET'
    });
};

export const updateUserNewsChannelConfig = (channelSettings) => {
    return request('/user/news-channel-config', {
        method: 'POST',
        body: {
            "content": JSON.stringify(channelSettings)
        }
    });
};