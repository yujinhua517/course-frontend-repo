// 簡單的測試腳本來驗證我們的邏輯
const mockCompetencies = [
    {
        job_role_code: 'DEV001',
        job_role_name: '前端開發工程師',
        description: '負責前端使用者介面開發與維護',
        is_active: true,
        create_time: '2024-01-01T09:00:00',
        create_user: 'admin',
        update_time: '2024-01-01T09:00:00',
        update_user: 'admin'
    },
    {
        job_role_code: 'DEV002',
        job_role_name: '後端開發工程師',
        description: '負責後端系統架構設計與 API 開發',
        is_active: true,
        create_time: '2024-01-02T09:00:00',
        create_user: 'admin',
        update_time: '2024-01-02T09:00:00',
        update_user: 'admin'
    }
];

function getMockCompetencies(params) {
    console.log('Testing with params:', params);
    let filteredData = [...mockCompetencies];
    
    // 分頁
    const page = params?.page || 0;
    const pageSize = params?.pageSize || 10;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    const totalRecords = filteredData.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    
    const result = {
        code: 200,
        message: '查詢成功',
        data: {
            data_list: paginatedData,
            total_records: totalRecords,
            first_index_in_page: startIndex + 1,
            last_index_in_page: Math.min(endIndex, totalRecords),
            pageable: true,
            totalPages,
            page,
            size: pageSize,
            hasNext: page < totalPages - 1,
            hasPrevious: page > 0
        }
    };
    
    console.log('Result:', result);
    return result;
}

// 測試無參數調用
console.log('=== Test 1: No params ===');
getMockCompetencies();

// 測試頁碼 0
console.log('\n=== Test 2: Page 0 ===');
getMockCompetencies({ page: 0, pageSize: 10 });

// 測試頁碼 1（0-based 應該沒資料）
console.log('\n=== Test 3: Page 1 ===');
getMockCompetencies({ page: 1, pageSize: 10 });
