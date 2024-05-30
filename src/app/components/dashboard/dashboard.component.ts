import { CommonModule, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { TanStackField, injectForm, injectStore } from '@tanstack/angular-form';
import {
  injectQuery,
  injectQueryClient,
} from '@tanstack/angular-query-experimental';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { CookieService } from 'ngx-cookie-service';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import {
  Observable,
  fromEvent,
  lastValueFrom,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { DeliveryService } from 'src/app/services/delivery.service';
import { PackageService } from 'src/app/services/package.service';
import {
  Delivery,
  DeliveryStatus,
  JoinDeliveryRoomDto,
  LeaveDeliveryRoomDto,
  Package,
  WsEvents,
} from 'src/common';
import { z } from 'zod';

type Marker = {
  markerOptions: google.maps.marker.AdvancedMarkerElementOptions;
  markerPosition: google.maps.LatLngLiteral;
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ButtonModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    TanStackField,
    CommonModule,
    GoogleMapsModule,
    KeyValuePipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private socket: Socket;

  constructor(private cookieService: CookieService) {
    const token = cookieService.get('access_token');
    this.socket = io('http://localhost:3000/events', {
      auth: {
        token,
      },
    });

    this.socket.on(WsEvents.JoinDeliveryRoom, (data) => {
      console.log({ [WsEvents.JoinDeliveryRoom]: { data } });
    });

    this.socket.on(WsEvents.LocationChanged, (data) => {
      console.log({ [WsEvents.LocationChanged]: { data } });
    });

    this.socket.on(WsEvents.StatusChanged, (data) => {
      console.log({ [WsEvents.StatusChanged]: { data } });
    });
  }

  ngOnInit(): void {
    this.joinRoom();

    setInterval(() => {
      console.log('20 seconds have passed');
      this.joinRoom();
    }, 20000);
  }

  keepOriginalOrder = (a: any, b: any) => a.key;

  zoom = 12;
  center!: google.maps.LatLngLiteral;
  options: google.maps.MapOptions = {
    mapTypeId: 'hybrid',
    zoomControl: true,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    gestureHandling: 'greedy',
    maxZoom: 15,
    minZoom: 8,
  };
  markers: Map<string, Marker> = new Map();

  getCurrentPosition(): Observable<GeolocationPosition> {
    return new Observable((observer) => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.options.center = this.center;
          this.addMarker(this.center, '#FF0000', 'Driver');

          this.joinRoom();
          observer.next(position);
        },
        (error) => observer.error(error),
        { enableHighAccuracy: true },
      );

      return () => navigator.geolocation.clearWatch(watchId);
    });
  }

  subscriptions = this.getCurrentPosition()
    .pipe(
      switchMap((geoLocPos) =>
        this.getDeliveries().pipe(
          tap((deliveries) => {
            const interest = deliveries.find(
              (d) => d.package._id === this.form.getFieldValue('package'),
            );

            if (interest) {
              this.addMarker(
                {
                  lat: interest.package.from_location.coordinates[1],
                  lng: interest.package.from_location.coordinates[0],
                },
                '#0000FF',
                'Origin',
              );

              this.addMarker(
                {
                  lat: interest.package.to_location.coordinates[1],
                  lng: interest.package.to_location.coordinates[0],
                },
                '#00FF00',
                'Destination',
              );
            }
          }),
          map(() => geoLocPos),
        ),
      ),
    )
    .subscribe();

  async addMarker(
    position: google.maps.LatLngLiteral,
    color: string,
    title: string,
  ) {
    const existingMarker = this.markers.get(color);

    if (existingMarker) {
      existingMarker.markerPosition = position;
    } else {
      const marker: Marker = {
        markerPosition: position,
        markerOptions: {
          position,
          title,
          content: {
            borderColor: color,
            background: color,
            glyphColor: color,
          } as google.maps.marker.PinElementOptions,
        } as google.maps.marker.AdvancedMarkerElementOptions,
      };

      this.markers.set(color, marker);
    }
  }

  packageService = inject(PackageService);

  packageQuery = injectQuery(() => ({
    enabled: true,
    queryKey: ['package'],
    queryFn: async (context) => {
      const abort = fromEvent(context.signal, 'abort');
      return lastValueFrom(
        this.packageService.findAllForUser().pipe(takeUntil(abort)),
      );
    },
  }));

  deliveryService = inject(DeliveryService);

  deliveryQuery = injectQuery(() => ({
    enabled: true,
    queryKey: ['delivery'],
    queryFn: async (context) => {
      const abort = fromEvent(context.signal, 'abort');
      return lastValueFrom(
        this.deliveryService.findAllForUser().pipe(takeUntil(abort)),
      );
    },
  }));

  queryClient = injectQueryClient();

  getDeliveries(): Observable<Delivery[]> {
    return of(this.deliveryQuery.data() ?? []);
  }

  getPackages(): Observable<Package[]> {
    return of(this.packageQuery.data() ?? []);
  }

  form = injectForm({
    defaultValues: {
      package: '',
    },
    validatorAdapter: zodValidator,
  });

  z = z;

  handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.form.handleSubmit();
  }

  packageId = injectStore(this.form, (state) => state.values.package);

  selectedDelivery = computed(() => {
    return (this.deliveryQuery.data() ?? []).find(
      (d) => d.package._id === this.packageId(),
    );
  });

  joinRoom = computed(() => {
    if (this.selectedDelivery()) {
      console.log(this.selectedDelivery());

      if (
        this.selectedDelivery()!.status !== DeliveryStatus.Failed ||
        this.selectedDelivery()!.status !== DeliveryStatus.Delivered
      ) {
        this.addMarker(
          {
            lat: this.selectedDelivery()!.package.from_location.coordinates[1],
            lng: this.selectedDelivery()!.package.from_location.coordinates[0],
          },
          '#0000FF',
          'Origin',
        );

        this.addMarker(
          {
            lat: this.selectedDelivery()!.package.to_location.coordinates[1],
            lng: this.selectedDelivery()!.package.to_location.coordinates[0],
          },
          '#00FF00',
          'Destination',
        );

        this.socket.emit(WsEvents.JoinDeliveryRoom, {
          event: WsEvents.JoinDeliveryRoom,
          delivery_id: this.selectedDelivery()!._id,
        } satisfies JoinDeliveryRoomDto);
      } else {
        this.socket.emit(WsEvents.LeaveDeliveryRoom, {
          delivery_id: this.selectedDelivery()!._id,
          event: WsEvents.LeaveDeliveryRoom,
        } satisfies LeaveDeliveryRoomDto);
      }
    }
  });
}
