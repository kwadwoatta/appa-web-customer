import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Delivery } from 'src/common';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  http = inject(HttpClient);

  findAllForUser = () =>
    this.http.get<Array<Delivery>>(
      'http://localhost:3000/api/users/me/delivery',
    );
}

export type CreateDeliveryDto = Omit<
  Delivery,
  '_id' | 'createdAt' | 'updatedAt' | 'package' | 'customer' | 'driver'
> & {
  package: string;
  customer: string;
  driver: string;
};
