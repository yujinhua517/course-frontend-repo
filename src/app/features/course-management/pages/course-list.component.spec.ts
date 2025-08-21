import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { CourseListComponent } from './course-list.component';
import { CourseService } from '../services/course.service';
import { GlobalMessageService } from '../../../core/message/global-message.service';
import { UserStore } from '../../../core/auth/user.store';
import { Course, CourseSearchParams } from '../models/course.model';
import { ServiceListResponse } from '../../../models/common.model';

describe('CourseListComponent', () => {
  let component: CourseListComponent;
  let fixture: ComponentFixture<CourseListComponent>;
  let mockCourseService: jasmine.SpyObj<CourseService>;
  let mockMessageService: jasmine.SpyObj<GlobalMessageService>;
  let mockUserStore: jasmine.SpyObj<UserStore>;

  const mockCourse: Course = {
    courseId: 1,
    courseEventId: 100,
    courseName: 'Test Course',
    learningType: '線上',
    skillType: '軟體力',
    level: '初階',
    hours: 8,
    isActive: true,
    remark: 'Test remark',
    createTime: '2024-01-01T00:00:00',
    createUser: 'test-user',
    updateTime: '2024-01-01T00:00:00',
    updateUser: 'test-user'
  };

  const mockApiResponse: ServiceListResponse<Course> = {
    code: 1000,
    message: 'Success',
    data: {
      dataList: [mockCourse],
      totalRecords: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false
    }
  };

  beforeEach(async () => {
    const courseServiceSpy = jasmine.createSpyObj('CourseService', ['searchCourses']);
    const messageServiceSpy = jasmine.createSpyObj('GlobalMessageService', ['success', 'error', 'info']);
    const userStoreSpy = jasmine.createSpyObj('UserStore', [], {
      user: signal({
        id: 1,
        username: 'test-user',
        permissions: [
          { resource: 'course', action: 'create' },
          { resource: 'course', action: 'read' },
          { resource: 'course', action: 'update' },
          { resource: 'course', action: 'delete' }
        ]
      })
    });

    await TestBed.configureTestingModule({
      imports: [CourseListComponent],
      providers: [
        { provide: CourseService, useValue: courseServiceSpy },
        { provide: GlobalMessageService, useValue: messageServiceSpy },
        { provide: UserStore, useValue: userStoreSpy }
      ]
    }).compileComponents();

    mockCourseService = TestBed.inject(CourseService) as jasmine.SpyObj<CourseService>;
    mockMessageService = TestBed.inject(GlobalMessageService) as jasmine.SpyObj<GlobalMessageService>;
    mockUserStore = TestBed.inject(UserStore) as jasmine.SpyObj<UserStore>;

    // Setup default service responses
    mockCourseService.searchCourses.and.returnValue(of(mockApiResponse));

    fixture = TestBed.createComponent(CourseListComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default search parameters', () => {
      fixture.detectChanges();
      
      const initialParams = component.currentSearchParams();
      expect(initialParams.keyword).toBe('');
      expect(initialParams.pageable).toBe(true);
      expect(initialParams.sortDirection).toBe('asc');
      expect(initialParams.firstIndexInPage).toBe(1);
      expect(initialParams.lastIndexInPage).toBe(10);
    });

    it('should be marked as initialized', () => {
      fixture.detectChanges();
      expect(component.isInitialized()).toBe(true);
    });
  });

  describe('Signal-based Data Management', () => {
    it('should load courses using resource API', () => {
      fixture.detectChanges();
      
      // The resource should automatically trigger the service call
      expect(mockCourseService.searchCourses).toHaveBeenCalled();
    });

    it('should compute courses from resource value', () => {
      fixture.detectChanges();
      
      // Wait for resource to load
      setTimeout(() => {
        const courses = component.courses();
        expect(courses).toEqual([mockCourse]);
      });
    });

    it('should compute loading state from resource', () => {
      fixture.detectChanges();
      
      // Initially should not be loading (sync response in test)
      expect(component.loading()).toBeFalsy();
    });

    it('should compute pagination info from resource', () => {
      fixture.detectChanges();
      
      setTimeout(() => {
        expect(component.totalRecords()).toBe(1);
        expect(component.currentPage()).toBe(1);
        expect(component.pageSize()).toBe(10);
        expect(component.totalPages()).toBe(1);
        expect(component.hasNext()).toBe(false);
        expect(component.hasPrevious()).toBe(false);
      });
    });
  });

  describe('ViewChild Signal API', () => {
    it('should define template signals using viewChild()', () => {
      // Verify that viewChild signals are defined
      expect(component.idTemplate).toBeDefined();
      expect(component.codeTemplate).toBeDefined();
      expect(component.nameTemplate).toBeDefined();
      expect(component.emailTemplate).toBeDefined();
      expect(component.deptTemplate).toBeDefined();
      expect(component.statusTemplate).toBeDefined();
      expect(component.timeTemplate).toBeDefined();
      expect(component.actionsTemplate).toBeDefined();
    });
  });

  describe('Search and Filter Operations', () => {
    it('should update search parameters when performing search', () => {
      const keyword = 'test search';
      
      component.onSearchChange(keyword);
      
      expect(component.searchKeyword()).toBe(keyword);
      expect(component.currentSearchParams().keyword).toBe(keyword);
    });

    it('should handle filter changes', () => {
      const filterEvent = { key: 'learningType', value: '線上' };
      
      component.onFilterChange(filterEvent);
      
      expect(component.currentSearchParams().learningType).toBe('線上');
      expect(mockMessageService.success).toHaveBeenCalledWith('篩選條件已套用');
    });

    it('should clear search and filters', () => {
      // Set some initial state
      component.searchKeyword.set('test');
      component.selectedCourses.set(new Set([1, 2]));
      
      component.clearSearch();
      
      expect(component.searchKeyword()).toBe('');
      expect(component.selectedCourses().size).toBe(0);
      expect(mockMessageService.success).toHaveBeenCalledWith('已清除所有搜尋條件');
    });

    it('should handle page size changes', () => {
      const newPageSize = 25;
      
      component.onPageSizeChange(newPageSize);
      
      const params = component.currentSearchParams();
      expect(params.lastIndexInPage).toBe(newPageSize);
      expect(mockMessageService.success).toHaveBeenCalledWith('已調整為每頁 25 筆');
    });
  });

  describe('Selection Management', () => {
    it('should toggle course selection', () => {
      const courseId = 1;
      
      // Initially not selected
      expect(component.isCourseSelected(courseId)).toBe(false);
      
      // Toggle to selected
      component.toggleCourseSelection(courseId);
      expect(component.isCourseSelected(courseId)).toBe(true);
      expect(component.selectedCourses().has(courseId)).toBe(true);
      
      // Toggle back to unselected
      component.toggleCourseSelection(courseId);
      expect(component.isCourseSelected(courseId)).toBe(false);
      expect(component.selectedCourses().has(courseId)).toBe(false);
    });

    it('should handle select all toggle', () => {
      // Mock courses data
      fixture.detectChanges();
      
      setTimeout(() => {
        // Select all
        component.onTableSelectAll(true);
        expect(component.selectedCourses().has(1)).toBe(true);
        
        // Deselect all
        component.onTableSelectAll(false);
        expect(component.selectedCourses().size).toBe(0);
      });
    });
  });

  describe('Permissions and UI State', () => {
    it('should compute user permissions correctly', () => {
      fixture.detectChanges();
      
      const permissions = component.permissions();
      expect(permissions.create).toBe(true);
      expect(permissions.read).toBe(true);
      expect(permissions.update).toBe(true);
      expect(permissions.delete).toBe(true);
    });

    it('should determine if fixed height is needed', () => {
      fixture.detectChanges();
      
      // With 1 course, should not need fixed height
      setTimeout(() => {
        expect(component.shouldUseFixedHeight()).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock error response
      const errorResponse: ServiceListResponse<Course> = {
        code: 5000,
        message: 'Server Error',
        data: null
      };
      
      mockCourseService.searchCourses.and.returnValue(of(errorResponse));
      
      fixture.detectChanges();
      
      setTimeout(() => {
        const error = component.error();
        expect(error).toBe('查詢失敗');
      });
    });
  });

  describe('Action Handlers', () => {
    it('should handle view action', () => {
      component.onView(mockCourse);
      expect(mockMessageService.info).toHaveBeenCalledWith('查看課程 1');
    });

    it('should handle edit action', () => {
      component.onEdit(mockCourse);
      expect(mockMessageService.info).toHaveBeenCalledWith('編輯課程 1');
    });

    it('should handle delete action with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      component.onDelete(mockCourse);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockMessageService.info).toHaveBeenCalledWith('已執行刪除（模擬）：1');
    });

    it('should cancel delete action when not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.onDelete(mockCourse);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockMessageService.info).not.toHaveBeenCalledWith('已執行刪除（模擬）：1');
    });
  });

  describe('Table Configuration', () => {
    it('should configure table header correctly', () => {
      fixture.detectChanges();
      
      const config = component.tableHeaderConfig();
      expect(config.columns).toBeDefined();
      expect(config.columns.length).toBe(8); // courseId, courseName, learningType, skillType, level, isActive, createTime, actions
      expect(config.showSelectColumn).toBe(true); // User has delete permission
    });

    it('should configure table body correctly', () => {
      fixture.detectChanges();
      
      setTimeout(() => {
        const config = component.tableBodyConfig();
        expect(config.data).toEqual([mockCourse]);
        expect(config.showSelectColumn).toBe(true);
        expect(config.trackByFn).toBeDefined();
      });
    });
  });
});