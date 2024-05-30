import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from 'src/common';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  http = inject(HttpClient);

  me = () => this.http.get<User>(`http://localhost:3000/api/users/me`);

  userById = (userId: number) =>
    this.http.get<User>(`http://localhost:3000/api/users/${userId}`);

  allUsers = () =>
    this.http.get<Array<User>>('http://localhost:3000/api/users');

  createUser = (dto: CreateUserDto) =>
    this.http.post<User>(`http://localhost:3000/api/users`, dto);
}

export interface CreateUserDto extends User {}
