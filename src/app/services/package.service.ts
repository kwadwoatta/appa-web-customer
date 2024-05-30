import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Package } from 'src/common';

@Injectable({
  providedIn: 'root',
})
export class PackageService {
  http = inject(HttpClient);

  findAllForUser = () =>
    this.http.get<Array<Package>>('http://localhost:3000/api/users/me/package');
}

export type CreatePackageDto = Omit<
  Package,
  'from_user' | 'to_user' | '_id' | 'createdAt' | 'updatedAt'
> & {
  from_user: string;
  to_user: string;
};
