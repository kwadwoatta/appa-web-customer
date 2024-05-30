import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  injectMutation,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { CookieService } from 'ngx-cookie-service';
import { lastValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(private router: Router) {}

  authService = inject(AuthService);
  cookieService = inject(CookieService);

  loginMutation = injectMutation(() => ({
    mutationFn: () =>
      lastValueFrom(
        this.authService.login({
          email: 'customer@gmail.com',
          password: 'password',
        }),
      ).then((response) => {
        const expiresIn = new Date();
        expiresIn.setHours(expiresIn.getHours() + 24);
        this.cookieService.set(
          'access_token',
          response.access_token,
          expiresIn,
          '/',
          '',
          true,
          'Strict',
        );

        this.router.navigate(['/dashboard']);
      }),
  }));

  queryClient = injectQueryClient();
}
