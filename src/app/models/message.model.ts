export interface GlobalMessage {
    readonly id: string;
    readonly type: MessageType;
    readonly title?: string;
    readonly content: string;
    readonly timestamp: Date;
    readonly timeout?: number;
    readonly dismissible: boolean;
    readonly actions?: readonly MessageAction[];
}

export interface MessageAction {
    readonly label: string;
    readonly action: () => void;
    readonly style?: 'primary' | 'secondary' | 'danger';
}

export enum MessageType {
    SUCCESS = 'success',
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error'
}

export interface MessageConfig {
    readonly timeout?: number;
    readonly dismissible?: boolean;
    readonly actions?: readonly MessageAction[];
}

export const DEFAULT_MESSAGE_CONFIG: MessageConfig = {
    timeout: 5000,
    dismissible: true,
    actions: []
} as const;
