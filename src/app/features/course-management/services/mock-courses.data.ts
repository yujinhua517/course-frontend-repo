// Mock data for CourseService
import { Course } from '../models/course.model';

export const MOCK_COURSES: Course[] = [
    {
        courseId: 1,
        courseEventId: 1001,
        courseName: "Angular 基礎入門",
        learningType: "線上",
        skillType: "軟體力",
        level: "基礎",
        hours: 12,
        isActive: true,
        remark: "適合初學者的線上課程",
        createTime: "2025-08-01T10:00:00Z",
        createUser: "admin",
        updateTime: "2025-08-10T12:30:00Z",
        updateUser: "alice"
    },
    {
        courseId: 2,
        courseEventId: 1002,
        courseName: "Spring Boot 進階應用",
        learningType: "實體",
        skillType: "數據力",
        level: "進階",
        hours: 24,
        isActive: true,
        remark: "需具備 Java 基礎",
        createTime: "2025-08-05T09:15:00Z",
        createUser: "bob",
        updateTime: "2025-08-12T14:45:00Z",
        updateUser: "charlie"
    },
    {
        courseId: 3,
        courseEventId: 1003,
        courseName: "資料庫設計與優化",
        learningType: "線上",
        skillType: "雲",
        level: "基礎",
        hours: 30,
        isActive: false,
        remark: "專案導向課程",
        createTime: "2025-07-25T08:00:00Z",
        createUser: "david",
        updateTime: "2025-08-15T11:00:00Z",
        updateUser: "eva"
    }
];
