import { TestBed } from '@angular/core/testing';
import { GlobalMessageService } from './global-message.service';
import { MessageType } from '../../models/message.model';

describe('GlobalMessageService', () => {
    let service: GlobalMessageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GlobalMessageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add success message', () => {
        const messageId = service.success('Test success message');
        const messages = service.messages();

        expect(messages).toHaveSize(1);
        expect(messages[0].type).toBe(MessageType.SUCCESS);
        expect(messages[0].content).toBe('Test success message');
        expect(messages[0].id).toBe(messageId);
    });

    it('should add error message with no timeout by default', () => {
        const messageId = service.error('Test error message');
        const messages = service.messages();

        expect(messages).toHaveSize(1);
        expect(messages[0].type).toBe(MessageType.ERROR);
        expect(messages[0].timeout).toBe(0);
    });

    it('should dismiss message by id', () => {
        const messageId = service.info('Test message');
        expect(service.messages()).toHaveSize(1);

        service.dismiss(messageId);
        expect(service.messages()).toHaveSize(0);
    });

    it('should dismiss all messages', () => {
        service.success('Message 1');
        service.info('Message 2');
        service.warning('Message 3');

        expect(service.messages()).toHaveSize(3);

        service.dismissAll();
        expect(service.messages()).toHaveSize(0);
    });

    it('should dismiss messages by type', () => {
        service.success('Success message');
        service.error('Error message');
        service.info('Info message');

        expect(service.messages()).toHaveSize(3);

        service.dismissByType(MessageType.ERROR);
        const remainingMessages = service.messages();

        expect(remainingMessages).toHaveSize(2);
        expect(remainingMessages.every(msg => msg.type !== MessageType.ERROR)).toBeTrue();
    });

    it('should auto-dismiss message after timeout', (done) => {
        service.info('Auto-dismiss message', undefined, { timeout: 100 });
        expect(service.messages()).toHaveSize(1);

        setTimeout(() => {
            expect(service.messages()).toHaveSize(0);
            done();
        }, 150);
    });

    it('should add message with custom config', () => {
        const messageId = service.warning('Custom message', 'Custom Title', {
            timeout: 10000,
            dismissible: false,
            actions: [{
                label: 'Test Action',
                action: () => { },
                style: 'primary'
            }]
        });

        const message = service.messages()[0];
        expect(message.title).toBe('Custom Title');
        expect(message.timeout).toBe(10000);
        expect(message.dismissible).toBeFalse();
        expect(message.actions).toHaveSize(1);
        expect(message.actions![0].label).toBe('Test Action');
    });
});
