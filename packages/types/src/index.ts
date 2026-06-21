export enum UserRole {
  ORGANIZER = "ORGANIZER",
  CUSTOMER = "CUSTOMER",
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface BookingConfirmationJobPayload {
  bookingId: string;
  customerId: string;
}

export interface EventUpdateNotificationJobPayload {
  eventId: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
}