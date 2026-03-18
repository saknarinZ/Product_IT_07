export interface Product {
  id: string; // UUID
  product_code: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface CreateProductRequest {
  product_code: string;
}

export interface AppError {
  error_code: string;
  message: string;
}
