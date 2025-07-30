import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { GlobalMessage, MessageType, MessageConfig, DEFAULT_MESSAGE_CONFIG } from '../../models/message.model';

@Injectable({
    providedIn: 'root'
})
export class GlobalMessageService {
    private readonly _messages = signal<readonly GlobalMessage[]>([]);
    private readonly _messageSubject = new BehaviorSubject<readonly GlobalMessage[]>([]);

    readonly messages = this._messages.asReadonly();
    readonly messages$ = this._messageSubject.asObservable();

    success(content: string, title?: string, config: MessageConfig = {}): string {
        return this.addMessage(MessageType.SUCCESS, content, title, config);
    }

    info(content: string, title?: string, config: MessageConfig = {}): string {
        return this.addMessage(MessageType.INFO, content, title, config);
    }

    warning(content: string, title?: string, config: MessageConfig = {}): string {
        return this.addMessage(MessageType.WARNING, content, title, config);
    }

    error(content: string, title?: string, config: MessageConfig = {}): string {
        return this.addMessage(MessageType.ERROR, content, title, {
            ...config,
            timeout: config.timeout ?? 3000 // Error messages don't auto-dismiss by default
        });
    }

    private addMessage(
        type: MessageType,
        content: string,
        title?: string,
        config: MessageConfig = {}
    ): string {
        const mergedConfig = { ...DEFAULT_MESSAGE_CONFIG, ...config };
        const id = this.generateId();

        const message: GlobalMessage = {
            id,
            type,
            title,
            content,
            timestamp: new Date(),
            timeout: mergedConfig.timeout,
            dismissible: mergedConfig.dismissible ?? true,
            actions: mergedConfig.actions ?? []
        };

        this.updateMessages(current => [...current, message]);

        // Auto-dismiss if timeout is set
        if (message.timeout && message.timeout > 0) {
            timer(message.timeout).subscribe(() => {
                this.dismiss(id);
            });
        }

        return id;
    }

    dismiss(messageId: string): void {
        this.updateMessages(current => current.filter(msg => msg.id !== messageId));
    }

    dismissAll(): void {
        this.updateMessages(() => []);
    }

    dismissByType(type: MessageType): void {
        this.updateMessages(current => current.filter(msg => msg.type !== type));
    }

    private updateMessages(updateFn: (current: readonly GlobalMessage[]) => readonly GlobalMessage[]): void {
        const newMessages = updateFn(this._messages());
        this._messages.set(newMessages);
        this._messageSubject.next(newMessages);
    }

    private generateId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
