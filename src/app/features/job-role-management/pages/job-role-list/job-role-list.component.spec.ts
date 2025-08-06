import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobRoleListComponent } from './job-role-list.component';

describe('JobRoleListComponent', () => {
  let component: JobRoleListComponent;
  let fixture: ComponentFixture<JobRoleListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobRoleListComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(JobRoleListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load job roles on init', () => {
    spyOn(component, 'loadJobRoles');
    component.ngOnInit();
    expect(component.loadJobRoles).toHaveBeenCalled();
  });

  it('should handle search', () => {
    const searchKeyword = 'test';
    component.onSearch(searchKeyword);
    expect(component.searchKeyword()).toBe(searchKeyword);
  });

  it('should handle selection', () => {
    const jobRole = {
      jobRoleCode: 'TEST001',
      jobRoleName: 'Test Role',
      description: 'Test Description',
      isActive: true,
      createTime: '2024-01-01T00:00:00',
      createUser: 'test',
      updateTime: '2024-01-01T00:00:00',
      updateUser: 'test'
    };

    component.onSelectItem(jobRole, true);
    expect(component.selectedJobRoles()).toContain(jobRole);

    component.onSelectItem(jobRole, false);
    expect(component.selectedJobRoles()).not.toContain(jobRole);
  });

  it('should handle form operations', () => {
    component.onCreateJobRole();
    expect(component.formMode()).toBe('create');
    expect(component.showForm()).toBe(true);
  });
});
