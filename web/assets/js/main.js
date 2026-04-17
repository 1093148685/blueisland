// 主js文件

// 导入模块
import { fetchMessages, postMessage } from './modules/api.js';
import { renderMessages, setupForm } from './modules/ui.js';

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 获取并渲染留言
        const messages = await fetchMessages();
        renderMessages(messages);
        
        // 设置表单提交
        setupForm();
    } catch (error) {
        console.error('初始化失败:', error);
    }
});