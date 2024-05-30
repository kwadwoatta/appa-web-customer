export interface Delivery {
  _id: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  pickup_time?: Date;
  start_time?: Date;
  end_time?: Date;
  location?: Point;
  status: DeliveryStatus;
  package: Package;
  customer: User;
  driver: User;
}

export enum DeliveryStatus {
  Open = 'open',
  PickedUp = 'picked-up',
  InTransit = 'in-transit',
  Delivered = 'delivered',
  Failed = 'failed',
}

export interface User {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  hash: string;
  address: string;
  firstName: string;
  lastName: string;
  role: Role;
  packages: Package[];
}

export enum Role {
  Admin = 'admin',
  Customer = 'customer',
  Driver = 'driver',
}

export interface Package {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  active_delivery_id?: string;
  active_delivery?: Delivery;
  description: string;
  weight: number;
  width: number;
  height: number;
  depth: number;
  from_address: string;
  from_location: Point;
  to_address: string;
  to_location: Point;
  deliveries: Delivery[];
  from_user: User;
  to_user: User;
}

export interface Point {
  type: 'Point';
  coordinates: number[];
}

export interface JoinDeliveryRoomDto {
  event: WsEvents.JoinDeliveryRoom;
  delivery_id: string;
}

export interface LeaveDeliveryRoomDto {
  event: WsEvents.LeaveDeliveryRoom;
  delivery_id: string;
}

export interface LocationChangedEventDto {
  event: WsEvents.LocationChanged;
  delivery_id: string;
  location: Point;
}

export interface StatusChangedEventDto {
  event: WsEvents.StatusChanged;
  delivery_id: string;
  status: DeliveryStatus;
}

export enum WsEvents {
  JoinDeliveryRoom = 'join_delivery_room',
  LeaveDeliveryRoom = 'leave_delivery_room',
  LocationChanged = 'location_changed',
  StatusChanged = 'status_changed',
  DeliveryUpdated = 'delivery_updated',
}
