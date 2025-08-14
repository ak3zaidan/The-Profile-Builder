export interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  countryName: string;
}

export interface UserCreditCard {
  holderName: string;
  number: string;
  exp: string;
  cvv: string;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingAddress: Address;
  billingAddress: Address;
  card: UserCreditCard;
}

export default Profile;