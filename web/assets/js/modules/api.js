// API交互模块

// 模拟API接口
const API_URL = 'https://api.example.com/messages';

export const fetchMessages = async () => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('获取留言失败');
    }
    return await response.json();
};

export const postMessage = async (messageData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
    });
    
    if (!response.ok) {
        throw new Error('提交留言失败');
    }
    
    return await response.json();
};