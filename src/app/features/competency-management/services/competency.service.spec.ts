import { TestBed } from '@angular/core/testing';
import { CompetencyService } from './competency.service';
import { CompetencySearchParams } from '../models/competency.model';

describe('CompetencyService', () => {
    let service: CompetencyService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CompetencyService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return competencies list', (done) => {
        service.getCompetencies().subscribe(response => {
            expect(response.data).toBeDefined();
            expect(response.data.length).toBeGreaterThan(0);
            expect(response.total).toBeGreaterThan(0);
            done();
        });
    });

    it('should filter competencies by keyword', (done) => {
        const params: CompetencySearchParams = { keyword: '前端' };
        service.getCompetencies(params).subscribe(response => {
            expect(response.data.length).toBeGreaterThan(0);
            expect(response.data[0].job_role_name).toContain('前端');
            done();
        });
    });

    it('should filter competencies by active status', (done) => {
        const params: CompetencySearchParams = { is_active: 1 };
        service.getCompetencies(params).subscribe(response => {
            expect(response.data.every(item => item.is_active === 1)).toBeTruthy();
            done();
        });
    });

    it('should create new competency', (done) => {
        const newCompetency = {
            job_role_code: 'TEST001',
            job_role_name: '測試工程師',
            description: '負責軟體測試工作',
            is_active: 1
        };

        service.createCompetency(newCompetency).subscribe(result => {
            expect(result.job_role_code).toBe(newCompetency.job_role_code);
            expect(result.job_role_name).toBe(newCompetency.job_role_name);
            expect(result.create_user).toBeDefined();
            expect(result.create_time).toBeDefined();
            done();
        });
    });

    it('should toggle active status', (done) => {
        service.toggleActiveStatus('DEV001').subscribe(result => {
            expect(result).toBeTruthy();
            expect(result?.update_time).toBeDefined();
            done();
        });
    });

    it('should delete competency', (done) => {
        service.deleteCompetency('DEV001').subscribe(result => {
            expect(result).toBeTruthy();
            done();
        });
    });
});
