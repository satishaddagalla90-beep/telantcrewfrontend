// Contact type for client contacts
export interface ClientContact {
  id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  display_name?: string;
  phone_no: string;
  email?: string;
  designation?: string;
  department?: string | string[];
}
