import { Request, Response, Router } from 'express';
import multer from 'multer';
import { Readable } from 'node:stream';
import readline from 'node:readline';
import { prismaClient } from './database/prismaClient';

const routes = Router();

const multerConfig = multer();

interface Product {
  code_bar: string,
  description: string,
  price: number,
  quantity: number,
}

routes.post('/products', 
  multerConfig.single('file'), 
  async (request: Request, response: Response) => {
    const file = request.file;
    const buffer = file?.buffer;
    
    const readableFile = new Readable();
    readableFile.push(buffer);
    readableFile.push(null);

    const productsLine = readline.createInterface({
      input: readableFile,
    });

    const products: Product[] = [];

    for await (let line of productsLine) {
      const productSLineSplit = line.split(',');

      products.push({
        code_bar: productSLineSplit[0],
        description: productSLineSplit[1],
        price: Number(productSLineSplit[2]),
        quantity: Number(productSLineSplit[3]),
      });
    }

    for await (let { code_bar, description, price, quantity } of products ) {
      await prismaClient.products.create({
        data: {
          code_bar,
          description,
          price,
          quantity,
        },
      });
    }

    return response.json(products);
});

export { routes }
