import { Component, input, output, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Course } from '../../models/course.model';
import { CourseEvent } from '../../../course-event-management/models/course-event.model';
import { CourseEventService } from '../../../course-event-management/services/course-event.service';
import { InfoDisplayComponent, InfoDisplayConfig } from '../../../../shared/components/info-display/info-display.component';
import { LoadingStateComponent, LoadingStateConfig } from '../../../../shared/components';

@Component({
    selector: 'app-course-view',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './course-view.component.html',
    styleUrls: ['./course-view.component.scss'],
    imports: [CommonModule, InfoDisplayComponent, LoadingStateComponent]
})
export class CourseViewComponent {
    private courseEventService = inject(CourseEventService);

    readonly infoReady = computed(() =>
        !this.courseEventsResource.isLoading() &&
        !this.courseEventsResource.error() &&
        !!this.course()
    );

    readonly course = input.required<Course>();
    readonly closed = output<void>();

    // 1) 課程活動選項 - 使用 resource 動態載入
    private readonly courseEventsResource = resource({
        loader: () => firstValueFrom(this.courseEventService.getPagedData({
            pageable: false, // 載入全部資料，不分頁
            isActive: true   // 只載入啟用的課程活動
        }))
    });

    // 2) 轉成「顯示字串」的快取 Map：id -> label
    readonly courseEventLabelMap = computed<Map<number, string>>(() => {
        const res = this.courseEventsResource.value();
        const map = new Map<number, string>();
        const list = res?.data?.dataList ?? [];
        for (const ev of list as CourseEvent[]) {
            if (!ev.courseEventId) continue;  // 跳過沒有ID的項目
            const label = `${ev.year} ${ev.semester} - ${ev.activityTitle}`;
            map.set(ev.courseEventId, label);
        }
        return map;
    });

    // 3) 提供一個取名的小工具（給 template 或 TS 用）
    // 三態版顯示工具
    getCourseEventLabel = (courseEventId?: number | null): string => {
        if (!courseEventId) return '無';
        if (this.courseEventsResource.isLoading()) return '載入中…';
        if (this.courseEventsResource.error()) return '載入失敗';
        return this.courseEventLabelMap().get(courseEventId) ?? `課程活動 #${courseEventId}`;
    };

    // InfoDisplay 配置（使用三態版）
    basicInfoConfig = computed<InfoDisplayConfig>(() => {
        const course = this.course();

        return {
            title: '基本資訊',
            columns: 2,
            items: [
                {
                    label: '課程活動資訊',
                    value: this.getCourseEventLabel(course?.courseEventId),
                    className: 'fw-medium text-primary'
                },
                {
                    label: '課程名稱',
                    value: course?.courseName || '',
                    className: 'fw-medium text-primary'
                },
            ]
        };
    });

    descriptionConfig = computed<InfoDisplayConfig>(() => {
        const course = this.course();
        return {
            title: '課程描述',
            columns: 2,
            items: [
                { label: '學習類型', value: course.learningType || '無' },
                { label: '技能類型', value: course.skillType || '無' },
                { label: '難易度', value: course.level || '無' },
                { label: '時數', value: course.hours?.toString() || '無' },
                {
                    label: '是否啟用',
                    value: course.isActive ? '啟用' : '停用',
                    type: 'badge',
                    variant: course.isActive ? 'success' : 'secondary'
                },
                { label: '備註', value: course.remark || '無' },
            ]
        };
    });

    systemInfoConfig = computed<InfoDisplayConfig>(() => {
        const course = this.course();
        return {
            title: '系統資訊',
            columns: 2,
            items: [
                {
                    label: '建立時間',
                    value: course.createTime,
                    icon: 'calendar-plus',
                    type: 'date'
                },
                {
                    label: '最後更新',
                    value: course.updateTime,
                    icon: 'calendar-check',
                    type: 'date'
                },
                {
                    label: '建立者',
                    value: course.createUser || '無',
                    icon: 'person-plus'
                },
                {
                    label: '更新者',
                    value: course.updateUser || '無',
                    icon: 'person-gear'
                }
            ]
        };
    });

    readonly loadingStateConfig: LoadingStateConfig = {
        size: 'md',
        text: '載入中…',
        showText: true,
        variant: 'primary',
        center: true
    };

    onClose(): void {
        this.closed.emit();
    }
}