import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalMessageService } from './global-message.service';
import { GlobalMessage, MessageType } from '../../models/message.model';

@Component({
    selector: 'app-global-message',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './global-message.component.html',
    styleUrls: ['./global-message.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalMessageComponent {
    private readonly messageService = inject(GlobalMessageService);

    readonly messages = this.messageService.messages;
    readonly MessageType = MessageType;

    onDismiss(messageId: string): void {
        this.messageService.dismiss(messageId);
    }

    onAction(action: () => void, messageId: string): void {
        action();
        this.messageService.dismiss(messageId);
    }

    getIconClass(type: MessageType): string {
        const iconMap = {
            [MessageType.SUCCESS]: 'bi-check-circle-fill',
            [MessageType.INFO]: 'bi-info-circle-fill',
            [MessageType.WARNING]: 'bi-exclamation-triangle-fill',
            [MessageType.ERROR]: 'bi-x-circle-fill'
        };
        return iconMap[type];
    }

    getAlertClass(type: MessageType): string {
        const classMap = {
            [MessageType.SUCCESS]: 'alert-success',
            [MessageType.INFO]: 'alert-info',
            [MessageType.WARNING]: 'alert-warning',
            [MessageType.ERROR]: 'alert-danger'
        };
        return classMap[type];
    }
}
