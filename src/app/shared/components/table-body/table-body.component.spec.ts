import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableBodyComponent } from './table-body.component';

describe('TableBodyComponent', () => {
    let component: TableBodyComponent;
    let fixture: ComponentFixture<TableBodyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TableBodyComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(TableBodyComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render table body with data', () => {
        const mockData = [
            { id: 1, name: 'Test 1' },
            { id: 2, name: 'Test 2' }
        ];

        const mockConfig = {
            data: mockData,
            showSelectColumn: false,
            columns: [
                { key: 'name', align: 'left' as const }
            ]
        };

        fixture.componentRef.setInput('config', mockConfig);
        fixture.detectChanges();

        const rows = fixture.nativeElement.querySelectorAll('tbody tr');
        expect(rows.length).toBe(2);
    });

    it('should show select column when enabled', () => {
        const mockData = [{ id: 1, name: 'Test' }];
        const mockConfig = {
            data: mockData,
            showSelectColumn: true,
            columns: [{ key: 'name' }]
        };

        fixture.componentRef.setInput('config', mockConfig);
        fixture.detectChanges();

        const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
        expect(checkbox).toBeTruthy();
    });

    it('should emit itemSelected when checkbox is clicked', () => {
        spyOn(component.itemSelected, 'emit');

        const mockData = [{ id: 1, name: 'Test' }];
        const mockConfig = {
            data: mockData,
            showSelectColumn: true,
            columns: [{ key: 'name' }]
        };

        fixture.componentRef.setInput('config', mockConfig);
        fixture.detectChanges();

        const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));

        expect(component.itemSelected.emit).toHaveBeenCalledWith({
            item: mockData[0],
            selected: true
        });
    });

    it('should emit rowClicked when row is clicked', () => {
        spyOn(component.rowClicked, 'emit');

        const mockData = [{ id: 1, name: 'Test' }];
        const mockConfig = {
            data: mockData,
            showSelectColumn: false,
            columns: [{ key: 'name' }]
        };

        fixture.componentRef.setInput('config', mockConfig);
        fixture.detectChanges();

        const row = fixture.nativeElement.querySelector('tbody tr');
        row.click();

        expect(component.rowClicked.emit).toHaveBeenCalledWith(mockData[0]);
    });
});
