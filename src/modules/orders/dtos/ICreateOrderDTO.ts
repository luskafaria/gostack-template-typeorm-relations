// import Customer from '@modules/customers/infra/typeorm/entities/Customer';

interface IProduct {
  product_id: string;
  price: number;
  quantity: number;
}

interface ICostumer {
  name: string;
  id: string;
  email: string;
}

export default interface ICreateOrderDTO {
  customer: ICostumer;
  products: IProduct[];
}
