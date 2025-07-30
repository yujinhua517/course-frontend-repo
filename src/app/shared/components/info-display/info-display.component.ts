import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface InfoItem {
    label: string;
    value: string | number | boolean | null | undefined;
    type?: 'text' | 'badge' | 'date' | 'status' | 'email' | 'phone' | 'link';
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
    icon?: string;
    href?: string;
    className?: string;
    visible?: boolean;
}

export interface InfoDisplayConfig {
    title?: string;
    items: InfoItem[];
    columns?: 1 | 2 | 3 | 4;
    cardClass?: string;
    titleClass?: string;
    itemClass?: string;
    showEmptyItems?: boolean;
}

@Component({
    selector: 'app-info-display',
    imports: [CommonModule],
    template: `
    <div [class]="cardClasses()">
      @if (config().title) {
        <div [class]="titleClasses()">
          {{ config().title }}
        </div>
      }
      <div [class]="contentClasses()">
        @for (item of visibleItems(); track item.label) {
          <div [class]="itemClasses()">
            <div class="info-label">
              @if (item.icon) {
                <i [class]="'bi bi-' + item.icon + ' me-1'"></i>
              }
              {{ item.label }}
            </div>
            <div class="info-value">
              @switch (item.type) {
                @case ('badge') {
                  <span [class]="'badge ' + getBadgeClass(item)">
                    {{ formatValue(item.value) }}
                  </span>
                }
                @case ('status') {
                  <span [class]="'badge ' + getStatusClass(item)">
                    {{ getStatusText(item.value) }}
                  </span>
                }
                @case ('date') {
                  <span class="text-muted">
                    {{ formatDate(item.value) }}
                  </span>
                }
                @case ('email') {
                  @if (item.value) {
                    <a [href]="'mailto:' + item.value" class="text-decoration-none">
                      {{ item.value }}
                    </a>
                  } @else {
                    <span class="text-muted">-</span>
                  }
                }
                @case ('phone') {
                  @if (item.value) {
                    <a [href]="'tel:' + item.value" class="text-decoration-none">
                      {{ item.value }}
                    </a>
                  } @else {
                    <span class="text-muted">-</span>
                  }
                }
                @case ('link') {
                  @if (item.value && item.href) {
                    <a [href]="item.href" target="_blank" class="text-decoration-none">
                      {{ item.value }}
                    </a>
                  } @else {
                    <span class="text-muted">{{ formatValue(item.value) }}</span>
                  }
                }
                @default {
                  <span [class]="item.className || ''">
                    {{ formatValue(item.value) }}
                  </span>
                }
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    @use "../../../../styles/variables" as *;
    .info-display-card {
      border: 1px solid #dee2e6;
      border-radius: 0.375rem;
      background-color: #fff;
      margin: 10px;
    }

    .info-display-title {
      padding: 1rem 1.5rem 0.5rem;
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #212529;
      border-bottom: 1px solid #dee2e6;
      background: $brand-bg-solid;
    }

    .info-display-content {
      padding: 1.5rem;
    }

    .info-display-content.columns-1 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .info-display-content.columns-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-display-content.columns-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .info-display-content.columns-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    @media (max-width: 992px) {
      .info-display-content.columns-3,
      .info-display-content.columns-4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 576px) {
      .info-display-content {
        grid-template-columns: 1fr !important;
      }
    }

    .info-display-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-size: 0.9rem;
      color: #212529;
      word-wrap: break-word;
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }

    a {
      color: #0d6efd;
    }

    a:hover {
      color: #0a58ca;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoDisplayComponent {
    config = input.required<InfoDisplayConfig>();

    visibleItems = computed(() => {
        const items = this.config().items;
        const showEmpty = this.config().showEmptyItems ?? false;

        return items.filter(item => {
            if (item.visible === false) return false;
            if (!showEmpty && this.isEmpty(item.value)) return false;
            return true;
        });
    });

    cardClasses = computed(() => {
        const baseClasses = ['info-display-card'];
        const customClass = this.config().cardClass;
        if (customClass) {
            baseClasses.push(customClass);
        }
        return baseClasses.join(' ');
    });

    titleClasses = computed(() => {
        const baseClasses = ['info-display-title'];
        const customClass = this.config().titleClass;
        if (customClass) {
            baseClasses.push(customClass);
        }
        return baseClasses.join(' ');
    });

    contentClasses = computed(() => {
        const columns = this.config().columns || 2;
        const baseClasses = ['info-display-content', `columns-${columns}`];
        return baseClasses.join(' ');
    });

    itemClasses = computed(() => {
        const baseClasses = ['info-display-item'];
        const customClass = this.config().itemClass;
        if (customClass) {
            baseClasses.push(customClass);
        }
        return baseClasses.join(' ');
    });

    private isEmpty(value: any): boolean {
        return value === null || value === undefined || value === '';
    }

    formatValue(value: any): string {
        if (this.isEmpty(value)) {
            return '-';
        }
        if (typeof value === 'boolean') {
            return value ? '是' : '否';
        }
        return String(value);
    }

    formatDate(value: any): string {
        if (this.isEmpty(value)) {
            return '-';
        }
        try {
            const date = new Date(value);
            return date.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return String(value);
        }
    }

    getBadgeClass(item: InfoItem): string {
        const variant = item.variant || 'secondary';
        return `bg-${variant}`;
    }

    getStatusClass(item: InfoItem): string {
        if (typeof item.value === 'boolean') {
            return item.value ? 'bg-success' : 'bg-secondary';
        }
        if (item.variant) {
            return `bg-${item.variant}`;
        }
        return 'bg-secondary';
    }

    getStatusText(value: any): string {
        if (typeof value === 'boolean') {
            return value ? '啟用' : '停用';
        }
        return this.formatValue(value);
    }
}
