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
        service.getJobRoles().subscribe(response => {
            expect(response.data).toBeDefined();
            expect(response.data.data_list.length).toBeGreaterThan(0);
            expect(response.data.total_records).toBeGreaterThan(0);
            done();
        });
    });

    it('should filter job roles by keyword', (done) => {
        const params: JobRoleSearchParams = { keyword: '前端' };
        service.getJobRoles(params).subscribe(response => {
            expect(response.data.data_list.length).toBeGreaterThan(0);
            expect(response.data.data_list[0].job_role_name).toContain('前端');
            done();
        });
    });

    it('should filter job roles by active status', (done) => {
        const params: JobRoleSearchParams = { is_active: true };
        service.getJobRoles(params).subscribe(response => {
            expect(response.data.data_list.every(item => item.is_active === true)).toBeTruthy();
            done();
        });
    });

    it('should create new job role', (done) => {
        const newJobRole = {
            job_role_code: 'TEST001',
            job_role_name: '測試工程師',
            description: '負責軟體測試工作',
            is_active: true
        };

        service.createJobRole(newJobRole).subscribe(result => {
            expect(result.data.job_role_code).toBe(newJobRole.job_role_code);
            expect(result.data.job_role_name).toBe(newJobRole.job_role_name);
            expect(result.data.create_user).toBeDefined();
            expect(result.data.create_time).toBeDefined();
            done();
        });
    });

    it('should update job role status', (done) => {
        service.batchUpdateJobRoleStatus(['DEV001'], false).subscribe(result => {
            expect(result.code).toBe(200);
            expect(result.data).toBeGreaterThan(0);
            done();
        });
    });

    it('should delete job role', (done) => {
        service.deleteJobRole('DEV001').subscribe(result => {
            expect(result.code).toBe(200);
            done();
        });
    });
});
