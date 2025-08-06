import { TestBed } from '@angular/core/testing';
import { JobRoleService } from './job-role.service';
import { JobRoleSearchParams } from '../models/job-role.model';

describe('JobRoleService', () => {
    let service: JobRoleService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(JobRoleService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return job roles list', (done) => {
        service.getPagedData().subscribe(response => {
            expect(response).toBeTruthy();
            expect(response.data.dataList).toBeInstanceOf(Array);
            expect(response.data.dataList.length).toBeGreaterThan(0);
            expect(response.data.totalRecords).toBeGreaterThan(0);
            done();
        });
    });

    it('should filter job roles by keyword', (done) => {
        const params: JobRoleSearchParams = { keyword: '前端' };
        service.getPagedData(params).subscribe(response => {
            expect(response.data.dataList.length).toBeGreaterThan(0);
            const foundJobRole = response.data.dataList.find(jr => jr.jobRoleName.includes('前端'));
            expect(foundJobRole).toBeTruthy();
            done();
        });
    });

    it('should filter job roles by active status', (done) => {
        const params: JobRoleSearchParams = { isActive: true };
        service.getPagedData(params).subscribe(response => {
            const allActive = response.data.dataList.every(jr => jr.isActive === true);
            expect(allActive).toBeTruthy();
            done();
        });
    });

    it('should create new job role', (done) => {
        const newJobRole = {
            jobRoleCode: 'TEST001',
            jobRoleName: '測試工程師',
            description: '負責軟體測試工作',
            isActive: true
        };

        service.createJobRole(newJobRole).subscribe(result => {
            expect(result).toBeTruthy();
            expect(result!.jobRoleCode).toBe(newJobRole.jobRoleCode);
            expect(result!.jobRoleName).toBe(newJobRole.jobRoleName);
            expect(result!.createUser).toBeDefined();
            expect(result!.createTime).toBeDefined();
            done();
        });
    });

    it('should update job role', (done) => {
        const updateData = {
            jobRoleId: 1,
            jobRoleCode: 'DEV001',
            jobRoleName: '資深開發工程師',
            description: '負責軟體開發工作',
            isActive: true
        };

        service.updateJobRole(1, updateData).subscribe(result => {
            expect(result).toBeTruthy();
            expect(result!.jobRoleCode).toBe(updateData.jobRoleCode);
            done();
        });
    });

    it('should delete job role', (done) => {
        service.deleteJobRole(1).subscribe(result => {
            expect(result).toBe(true);
            done();
        });
    });
});
