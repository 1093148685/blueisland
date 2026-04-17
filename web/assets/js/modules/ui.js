document.addEventListener('DOMContentLoaded', function() {
    // 后端API地址
    const API_BASE_URL = '/api/messages';

    // 敏感词库
    const SENSITIVE_WORDS = [
        '枪支', '毒品', '赌博', '诈骗', '发票', '代考',
        '约炮', '裸聊', '成人', '情色', '包养', '招嫖',
        '领导人', '政府', '中共', '共产党', '国家机密',
        '杀人', '自杀', '爆炸', '恐怖袭击'
    ];

    // 违规字符规则
    const FORBIDDEN_RULES = {
        basic: /[<>"\\]/g,
        emoji: /[\uD800-\uDFFF]|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g,
        control: /[\x00-\x1F\x7F-\x9F]/g,
        sensitive: new RegExp(SENSITIVE_WORDS.join('|'), 'i'),
        url: /(http|https):\/\/[^\s]+/g,
        phone: /(\+?86)?1[3-9]\d{9}/g,
        idCard: /[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g
    };

    // 初始化默认状态
    function initializeDefaults() {
        document.querySelector('.toggle-btn[data-type="anonymous"]').classList.add('active');
        document.querySelector('.avatar-option[data-avatar="1"]').classList.add('selected');
        document.getElementById('selectedAvatar').value = '1';
        document.getElementById('qqAvatar').style.display = 'none';
        document.getElementById('wordCount').textContent = '0/300';
        document.getElementById('contentError').textContent = '';
        document.getElementById('secretCodeError').textContent = '';
    }

    // 设置实时字数统计和内容检测
    function setupContentCheck() {
        const textarea = document.getElementById('messageContent');
        const wordCountDisplay = document.getElementById('wordCount');
        const contentError = document.getElementById('contentError');
        const maxLength = 300;

        textarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            wordCountDisplay.textContent = `${currentLength}/${maxLength}`;

            if (currentLength > maxLength) {
                wordCountDisplay.classList.add('limit-exceeded');
            } else {
                wordCountDisplay.classList.remove('limit-exceeded');
            }

            checkForbiddenChars(this, contentError);
        });

        const secretCodeInput = document.getElementById('secretCode');
        const secretCodeError = document.getElementById('secretCodeError');
        secretCodeInput.addEventListener('input', function() {
            checkForbiddenChars(this, secretCodeError);
        });
    }

    // 检查违规内容
    function checkForbiddenChars(input, errorElement) {
        let hasForbidden = false;
        let message = '';
        let matchedText = '';

        for (const [type, rule] of Object.entries(FORBIDDEN_RULES)) {
            const match = input.value.match(rule);
            if (match) {
                hasForbidden = true;
                matchedText = match[0].substring(0, 10) + (match[0].length > 10 ? '...' : '');
                switch(type) {
                    case 'basic':
                        message = `包含非法字符: ${matchedText}`;
                        break;
                    case 'emoji':
                        message = '暂不支持表情符号';
                        break;
                    case 'control':
                        message = '包含不可见控制字符';
                        break;
                    case 'sensitive':
                        message = `包含敏感词: ${matchedText}`;
                        break;
                    case 'url':
                        message = '不能包含网址链接';
                        break;
                    case 'phone':
                        message = '不能包含手机号码';
                        break;
                    case 'idCard':
                        message = '不能包含身份证号';
                        break;
                }
                break;
            }
        }

        if (hasForbidden) {
            errorElement.innerHTML = `<i class="icon-warning">⚠</i> ${message}`;
            errorElement.classList.add('show');
        } else {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }

        return !hasForbidden;
    }

    // 头像类型切换功能
    function setupAvatarTypeToggle() {
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        const anonymousAvatars = document.getElementById('anonymousAvatars');
        const qqAvatar = document.getElementById('qqAvatar');

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                toggleBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                if (this.dataset.type === 'anonymous') {
                    anonymousAvatars.style.display = 'block';
                    qqAvatar.style.display = 'none';
                } else {
                    anonymousAvatars.style.display = 'none';
                    qqAvatar.style.display = 'block';
                }
            });
        });
    }

    // 匿名头像选择功能
    function setupAnonymousAvatarSelection() {
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(option => {
            option.addEventListener('click', function() {
                avatarOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('selectedAvatar').value = this.dataset.avatar;
            });
        });
    }

    // QQ头像获取功能
    function setupQQAvatarFetch() {
        const fetchQQBtn = document.getElementById('fetchQQAvatar');
        const qqNumberInput = document.getElementById('qqNumber');
        const qqAvatarPreview = document.getElementById('qqAvatarPreview');
        const qqStatus = document.getElementById('qqStatus');

        fetchQQBtn.addEventListener('click', function() {
            const qqNumber = qqNumberInput.value.trim();

            if (!qqNumber || !/^[1-9][0-9]{4,11}$/.test(qqNumber)) {
                showStatus(qqStatus, '请输入有效的QQ号码(5-12位数字)', 'error');
                return;
            }

            fetchQQBtn.classList.add('loading');

            setTimeout(async () => {
                try {
                    showStatus(qqStatus, '正在获取QQ头像...', 'info');

                    const qqAvatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=100&t=${Date.now()}`;

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => {
                        controller.abort();
                        throw new Error('获取QQ头像超时');
                    }, 5000);

                    await loadImage(qqAvatarUrl);
                    clearTimeout(timeoutId);

                    qqAvatarPreview.src = qqAvatarUrl;
                    qqAvatarPreview.style.display = 'block';
                    showStatus(qqStatus, 'QQ头像获取成功！', 'success');

                } catch (error) {
                    showStatus(qqStatus, error.message || '获取QQ头像失败，请检查QQ号是否正确', 'error');
                } finally {
                    fetchQQBtn.classList.remove('loading');
                }
            }, 500);
        });
    }

    // 图片加载辅助函数
    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    // 表单提交处理
    function setupFormSubmission() {
        const messageForm = document.getElementById('messageForm');
        const submitStatus = document.getElementById('submitStatus');
        const contentError = document.getElementById('contentError');
        const secretCodeError = document.getElementById('secretCodeError');
        const submitBtn = document.querySelector('.submit-btn');

        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();

            contentError.classList.remove('show');
            secretCodeError.classList.remove('show');

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> 提交中...';

            setTimeout(async () => {
                try {
                    const activeBtn = document.querySelector('.toggle-btn.active');
                    const avatarType = activeBtn.dataset.type;

                    const requestData = {
                        content: document.getElementById('messageContent').value.trim(),
                        secretCode: document.getElementById('secretCode').value.trim(),
                        avatarType: avatarType,
                        avatarId: avatarType === 'anonymous'
                            ? document.getElementById('selectedAvatar').value
                            : document.getElementById('qqNumber').value.trim()
                    };

                    const isContentValid = checkForbiddenChars(
                        document.getElementById('messageContent'),
                        contentError
                    );

                    const isSecretValid = checkForbiddenChars(
                        document.getElementById('secretCode'),
                        secretCodeError
                    );

                    if (!isContentValid || !isSecretValid) {
                        throw new Error('请修正表单中的错误');
                    }

                    const validationError = validateFormData(requestData, avatarType);
                    if (validationError) {
                        throw new Error(validationError);
                    }

                    showStatus(submitStatus, '正在提交留言...', 'info');

                    const response = await fetch(API_BASE_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(requestData)
                    });

                    if (!response.ok) {
                        const errorResponse = await parseErrorResponse(response);
                        throw new Error(errorResponse.message || `请求失败: ${response.status}`);
                    }

                    const responseData = await response.json();
                    handleSubmissionSuccess(responseData, submitStatus, messageForm);

                } catch (error) {
                    handleSubmissionError(error, submitStatus);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '提交留言';
                }
            }, 500);
        });
    }

    // 表单数据验证
    function validateFormData(data, avatarType) {
        if (!data.content) return '请输入留言内容';
        if (data.content.length < 6) return '留言内容不能低于6个字';
        if (data.content.length > 300) return '留言内容不能超过300个字';
        if (!data.secretCode) return '请输入暗语';
        if (data.secretCode.length < 2) return '暗语至少需要2个字符';
        if (avatarType === 'qq' && !/^\d+$/.test(data.avatarId)) {
            return 'QQ号码必须为数字';
        }
        return null;
    }

    // 解析错误响应
    async function parseErrorResponse(response) {
        try {
            const errorData = await response.json();
            if (Array.isArray(errorData.detail)) {
                const errors = errorData.detail.map(e => `${e.loc[1]}: ${e.msg}`).join(', ');
                return { message: `验证错误: ${errors}` };
            }
            return errorData;
        } catch {
            return { message: '服务器返回了无效的响应' };
        }
    }

    // 处理提交成功
    function handleSubmissionSuccess(data, statusElement, form) {
        showStatus(statusElement, '留言提交成功！', 'success');
        form.reset();
        document.getElementById('qqAvatarPreview').style.display = 'none';

        document.querySelectorAll('.avatar-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.avatar === "1");
        });
        document.getElementById('selectedAvatar').value = '1';
        document.getElementById('wordCount').textContent = '0/300';
        document.getElementById('wordCount').classList.remove('limit-exceeded');
    }

    // 处理提交错误
    function handleSubmissionError(error, statusElement) {
        console.error('提交留言失败:', error);
        const errorMessage = error.message.includes('Failed to fetch')
            ? '网络连接失败，请检查网络设置'
            : error.message;
        showStatus(statusElement, errorMessage, 'error');
    }

    // 状态显示函数
    function showStatus(element, message, type) {
        if (element.timeoutId) clearTimeout(element.timeoutId);

        element.textContent = message;
        element.className = `status-message ${type}`;
        element.style.display = 'block';

        element.timeoutId = setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }

    // 初始化所有功能
    initializeDefaults();
    setupContentCheck();
    setupAvatarTypeToggle();
    setupAnonymousAvatarSelection();
    setupQQAvatarFetch();
    setupFormSubmission();
});
