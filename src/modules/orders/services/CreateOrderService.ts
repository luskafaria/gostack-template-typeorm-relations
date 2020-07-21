import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
  price: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExists = await this.customersRepository.findById(customer_id);

    if (!customerExists) {
      throw new AppError('Customer not found');
    }

    const productsIds = products.map(product => {
      return { id: product.id };
    });

    const findProducts = await this.productsRepository.findAllById(productsIds);

    if (findProducts.length !== products.length) {
      throw new AppError(
        'This products list contains one or more not registered products',
      );
    }

    const newProductsQuantities: IUpdateProductsQuantityDTO[] = [];

    const updatedProducts = findProducts.map(findProduct => {
      const orderProduct = products.find(
        product => product.id === findProduct.id,
      );

      if (orderProduct && findProduct.quantity < orderProduct.quantity) {
        throw new AppError(
          `
              ${findProduct.name} current stock: ${findProduct.quantity}\n
              You have ordered: ${orderProduct.quantity} units
            `,
        );
      }

      if (orderProduct) {
        newProductsQuantities.push({
          id: orderProduct.id,
          quantity: findProduct.quantity - orderProduct.quantity,
        });

        return {
          ...findProduct,
          quantity: orderProduct.quantity,
        };
      }

      return findProduct;
    });

    await this.productsRepository.updateQuantity(newProductsQuantities);

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: updatedProducts.map(product => ({
        product_id: product.id,
        price: product.price,
        quantity: product.quantity,
      })),
    });

    return order;
  }
}

export default CreateOrderService;
