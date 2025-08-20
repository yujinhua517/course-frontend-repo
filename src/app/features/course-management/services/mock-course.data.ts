// Mock data for DepartmentService
import { Course } from '../models/course.model';

/**
 * 模擬課程資料
 * 開發階段使用，正式環境應改為 useMockData: false
 */
export const MOCK_COURSES: Course[] = [
    {
        courseId: 1,
        courseEventId: 101,
        courseName: 'Angular 18 全端開發',
        learningType: '線上',
        skillType: '軟體力',
        level: '中階',
        hours: 40,
        isActive: true,
        remark: '適合有基礎的前端工程師',
        createTime: '2024-01-15T10:00:00',
        createUser: 'admin',
        updateTime: '2024-08-19T15:30:00',
        updateUser: 'admin'
    },
    {
        courseId: 2,
        courseEventId: 102,
        courseName: 'Spring Boot 微服務架構',
        learningType: '實體',
        skillType: '軟體力',
        level: '進階',
        hours: 32,
        isActive: true,
        remark: '企業級後端開發',
        createTime: '2024-02-10T09:00:00',
        createUser: 'admin',
        updateTime: '2024-08-18T16:45:00',
        updateUser: 'instructor'
    },
    {
        courseId: 3,
        courseEventId: 103,
        courseName: 'Python 資料分析',
        learningType: '混合',
        skillType: '數據力',
        level: '初階',
        hours: 24,
        isActive: true,
        remark: '適合初學者',
        createTime: '2024-03-05T14:00:00',
        createUser: 'admin',
        updateTime: '2024-08-20T10:20:00',
        updateUser: 'admin'
    },
    {
        courseId: 4,
        courseEventId: 104,
        courseName: 'AWS 雲端架構設計',
        learningType: '線上',
        skillType: '雲',
        level: '進階',
        hours: 48,
        isActive: false,
        remark: '暫停開課',
        createTime: '2024-01-20T11:30:00',
        createUser: 'admin',
        updateTime: '2024-08-15T14:15:00',
        updateUser: 'admin'
    }
];