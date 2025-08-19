import { Component, OnInit, signal, computed, inject, ViewChild, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { Course } from '../models/course.model';
import { CourseService } from '../services/course.service';
import { UserStore } from '../../../core/auth/user.store';
import type { User, Permission } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { CourseFormComponent } from '../components/course-form/course-form.component';
import { CourseViewComponent } from '../components/course-view/course-view.component';
import { TableHeaderComponent, TableHeaderConfig } from '../../../shared/components/table-header/table-header.component';
import { TableBodyComponent } from '../../../shared/components/table-body/table-body.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ActionButtonGroupComponent } from '../../../shared/components/action-buttons/action-button-group.component';
import { SearchFilterComponent } from '../../../shared/components/search-filter/search-filter.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { GlobalMessageService } from '../../../core/message/global-message.service';
import { HighlightPipe } from '../../../shared/pipes/highlight.pipe';


@Component({
    selector: 'app-course-list',
    templateUrl: './course-list.component.html',
    styleUrls: ['./course-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        CourseFormComponent,
        CourseViewComponent,
        TableHeaderComponent,
        TableBodyComponent,
        StatusBadgeComponent,
        ActionButtonGroupComponent,
        SearchFilterComponent,
        PaginationComponent,
        LoadingStateComponent,
        ErrorMessageComponent,
        EmptyStateComponent,
        ConfirmationModalComponent,
        HighlightPipe
    ]
})
export class CourseListComponent implements OnInit {
    //DI（inject）成員：
    private courseService = inject(CourseService);
    private messageService = inject(GlobalMessageService);
    private readonly userStore = inject(UserStore);

    // 權限管理
    /**
     * 建立了一個 computed signal，輸出的是「一個函式」。
     * 這個函式會：
     *   從 userStore 取出目前使用者。
     *   如果沒有登入使用者 → 回傳 false。
     *   如果有 → 檢查使用者的 permissions 陣列裡，是否有符合 (resource, action) 的權限。
     */
    private readonly hasResourceActionPermission = computed(() => {
        return (resource: string, action: string): boolean => {
            const user = this.userStore.user() as User | null;
            if (!user) return false;
            return (user.permissions ?? []).some((p: Permission) =>
                p.resource === resource && p.action === action
            );
        };
    });

    // 權限快捷計算屬性
    /**
     * UI template 上只要 *@If="permissions().create" 就能顯示/隱藏按鈕。
     */
    readonly permissions = computed(() => {
        const hasPermission = this.hasResourceActionPermission();
        return {
            create: hasPermission('course', 'create'),
            read: hasPermission('course', 'read'),
            update: hasPermission('course', 'update'),
            delete: hasPermission('course', 'delete')
        };
    });

    ngOnInit(): void {

    }


}