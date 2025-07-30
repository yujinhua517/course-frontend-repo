import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { UserStore } from '../../../core/auth/user.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly userStore = inject(UserStore);

  readonly loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly success = signal(false);

  readonly rememberMe = signal(false);

  // 獲取 returnUrl 參數
  private readonly returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

  constructor() {
    // 檢查是否已經登入，如果是則直接重定向
    if (this.userStore.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
      return;
    }

    const saved = localStorage.getItem('remembered-username');
    if (saved) {
      this.loginForm.patchValue({ username: saved });
      this.rememberMe.set(true);
    }
  }

  readonly submit = effect(() => {
    // No-op, for signals demo
  });

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  onRememberMeChange(): void {
    if (this.rememberMe()) {
      localStorage.setItem('remembered-username', this.loginForm.value.username || '');
    } else {
      localStorage.removeItem('remembered-username');
    }
  }

  onRememberMeToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement)?.checked ?? false;
    this.rememberMe.set(checked);
    this.onRememberMeChange();
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    alert('請聯絡系統管理員或使用密碼重設功能。');
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const { username, password } = this.loginForm.value;

    this.authService.login(username!, password!, this.returnUrl).subscribe({
      next: (response) => {
        this.success.set(true);

        // 處理記住帳號功能
        if (this.rememberMe()) {
          localStorage.setItem('remembered-username', username!);
        } else {
          localStorage.removeItem('remembered-username');
        }

        // 延遲導航以顯示成功消息
        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 1000);
      },
      error: (err: unknown) => {
        const msg = typeof err === 'object' && err && 'message' in err
          ? (err as { message?: string }).message
          : undefined;

        const errorMessage = msg || '登入失敗，請檢查帳號密碼';
        this.error.set(errorMessage);

        this.loading.set(false);
        this.success.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
