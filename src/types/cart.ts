export interface CartItem {
  slug: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}
