import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableHeaderComponent, TableHeaderConfig } from './table-header.component';
import { signal } from '@angular/core';

describe('TableHeaderComponent', () => {
    let component: TableHeaderComponent;
    let fixture: ComponentFixture<TableHeaderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TableHeaderComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TableHeaderComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        // 設定必要的輸入
        const config: TableHeaderConfig = {
            columns: [
                { key: 'name', label: '名稱', sortable: true },
                { key: 'status', label: '狀態', sortable: false }
            ],
            showSelectAll: true,
            sortBy: 'name',
            sortDirection: 'asc'
        };

        fixture.componentRef.setInput('config', config);
        fixture.detectChanges();

        expect(component).toBeTruthy();
    });

    it('should emit sort event when sortable column is clicked', () => {
        const config: TableHeaderConfig = {
            columns: [
                { key: 'name', label: '名稱', sortable: true }
            ],
            sortBy: 'name',
            sortDirection: 'asc'
        };

        fixture.componentRef.setInput('config', config);

        spyOn(component.sortChanged, 'emit');

        component.onSort(config.columns[0]);

        expect(component.sortChanged.emit).toHaveBeenCalledWith({
            column: 'name',
            direction: 'desc'
        });
    });

    it('should emit select all event when checkbox is clicked', () => {
        const config: TableHeaderConfig = {
            columns: [],
            showSelectAll: true
        };

        fixture.componentRef.setInput('config', config);

        spyOn(component.selectAllChanged, 'emit');

        const mockEvent = {
            target: { checked: true }
        } as any;

        component.onSelectAll(mockEvent);

        expect(component.selectAllChanged.emit).toHaveBeenCalledWith(true);
    });

    it('should return correct sort icon', () => {
        const config: TableHeaderConfig = {
            columns: [
                { key: 'name', label: '名稱', sortable: true }
            ],
            sortBy: 'name',
            sortDirection: 'asc'
        };

        fixture.componentRef.setInput('config', config);

        expect(component.getSortIcon(config.columns[0])).toBe('bi-chevron-up');

        // 測試不同排序方向
        const descConfig = { ...config, sortDirection: 'desc' as const };
        fixture.componentRef.setInput('config', descConfig);

        expect(component.getSortIcon(config.columns[0])).toBe('bi-chevron-down');
    });

    it('should return correct align class', () => {
        expect(component.getAlignClass({ key: 'test', label: 'Test', align: 'center' })).toBe('text-center');
        expect(component.getAlignClass({ key: 'test', label: 'Test', align: 'right' })).toBe('text-end');
        expect(component.getAlignClass({ key: 'test', label: 'Test', align: 'left' })).toBe('');
        expect(component.getAlignClass({ key: 'test', label: 'Test' })).toBe('');
    });
});
