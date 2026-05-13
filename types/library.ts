export interface Book {
  id: string; title: string; author: string; isbn: string;
  category: string; description: string; cover_url: string;
  total_copies: number; available_copies: number; archived: boolean;
  created_at: string; updated_at: string;
}
export interface Borrow {
  id: string; user_id: string; book_id: string; status: string;
  borrow_date: string; due_date: string; return_date: string;
  renewed_count: number; notes: string; created_at: string;
  user?: { name: string; email: string };
  book?: { title: string; author: string; available_copies: number };
}
export interface Reservation {
  id: string; user_id: string; book_id: string; status: string;
  queue_position: number; created_at: string;
  user?: { name: string; email: string };
  book?: { title: string; author: string; available_copies: number };
}
export interface Appointment {
  id: string; user_id: string; type: string; room: string;
  date: string; start_time: string; end_time: string;
  status: string; notes: string; created_at: string;
  user?: { name: string; email: string };
}
export interface Fine {
  id: string; user_id: string; borrow_id: string;
  amount: number; paid: boolean; paid_at: string; created_at: string;
  user?: { name: string; email: string };
  borrow?: { book?: { title: string } };
}
export interface LibraryUser {
  id: string; name: string; email: string; role: string; created_at: string;
}
export interface Settings {
  id: number; library_name: string; max_borrow_days: number;
  max_books_per_member: number; fine_per_day: number;
  allow_renewals: boolean; max_renewals: number;
}
export interface Notification {
  id: string; user_id: string; title: string; message: string;
  type: string; read: boolean; created_at: string;
}
