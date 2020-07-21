import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IRequest {
  id: string;
}

@injectable()
class FindOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
  ) {}

  public async execute({ id }: IRequest): Promise<Order | undefined> {
    try {
      const findOrder = await this.ordersRepository.findById(id);

      if (!findOrder) {
        throw new AppError('Order not found');
      }

      return findOrder;
    } catch (error) {
      throw new AppError(error.message);
    }
  }
}

export default FindOrderService;
