// 測試後端連接的簡單腳本
const testBackendConnection = async () => {
    try {
        // 測試後端健康檢查
        const response = await fetch('http://localhost:8080/api/job-roles', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ 後端連接成功！');
            console.log('回應數據:', data);
        } else {
            console.log('❌ 後端連接失敗，狀態碼:', response.status);
        }
    } catch (error) {
        console.log('❌ 後端連接失敗:', error.message);
    }
};

// 如果在瀏覽器環境中執行
if (typeof window !== 'undefined') {
    testBackendConnection();
}

// 如果在 Node.js 環境中執行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = testBackendConnection;
}
