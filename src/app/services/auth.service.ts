import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  http = inject(HttpClient);

  login = (dto: AuthDto) =>
    this.http.post<Auth>(`http://localhost:3000/api/auth/login`, dto);

  constructor(
    private cookieService: CookieService,
    private router: Router,
  ) {}

  checkAccessToken() {
    const token = this.cookieService.get('access_token');
    if (
      token &&
      (window.location.pathname === '/' ||
        window.location.pathname === '/login')
    ) {
      this.router.navigate(['/dashboard']);
    }
  }
}

export interface AuthDto {
  email: string;
  password: string;
}
export interface Auth {
  access_token: string;
}
