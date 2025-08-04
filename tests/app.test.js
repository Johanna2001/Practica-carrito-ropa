const request = require('supertest');
const fs = require('fs');
const app = require('../index');

describe('API del Carrito de Compras de Ropa', () => {
  const testProduct = {
    id: 'test-product',
    name: 'Producto de Prueba',
    price: 25.99,
    image: 'https://example.com/test-image.jpg'
  };

  const testCartItem = {
    productId: '1',
    quantity: 2
  };

  beforeAll(() => {
    // Asegurar que existan los archivos de base de datos para testing
    if (!fs.existsSync('./products.json')) {
      fs.writeFileSync('./products.json', JSON.stringify([testProduct], null, 2));
    }
    if (!fs.existsSync('./cart.json')) {
      fs.writeFileSync('./cart.json', JSON.stringify([], null, 2));
    }
  });

  afterAll(() => {
    // Limpieza: restaurar estado inicial del carrito
    try {
      fs.writeFileSync('./cart.json', JSON.stringify([], null, 2));
    } catch (error) {
      console.log('Error en limpieza:', error);
    }
  });

  describe('Endpoints básicos', () => {
    it('Debe servir la página principal', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    it('Debe responder el endpoint de status', async () => {
      const res = await request(app).get('/api/status');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/Servidor de carrito de compras/i);
      expect(res.body.status).toBe(200);
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('API de Productos', () => {
    it('Debe obtener todos los productos', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('name');
        expect(res.body[0]).toHaveProperty('price');
        expect(res.body[0]).toHaveProperty('image');
      }
    });
  });

  describe('API del Carrito', () => {
    beforeEach(async () => {
      // Limpiar carrito antes de cada test
      await request(app).delete('/api/cart');
    });

    it('Debe obtener el carrito vacío inicialmente', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('Debe agregar un producto al carrito', async () => {
      const res = await request(app)
        .post('/api/cart')
        .send(testCartItem);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toMatch(/agregado al carrito/i);
      expect(res.body.cart).toBeDefined();
    });

    it('Debe incrementar cantidad si el producto ya existe en el carrito', async () => {
      // Agregar producto por primera vez
      await request(app)
        .post('/api/cart')
        .send(testCartItem);

      // Agregar el mismo producto nuevamente
      const res = await request(app)
        .post('/api/cart')
        .send({ productId: testCartItem.productId, quantity: 1 });

      expect(res.statusCode).toBe(201);
      
      // Verificar que la cantidad se incrementó
      const cartRes = await request(app).get('/api/cart');
      const item = cartRes.body.find(item => item.productId === testCartItem.productId);
      expect(item.quantity).toBe(testCartItem.quantity + 1);
    });

    it('Debe retornar error 404 para producto inexistente', async () => {
      const res = await request(app)
        .post('/api/cart')
        .send({ productId: 'producto-inexistente', quantity: 1 });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/producto no encontrado/i);
    });

    it('Debe actualizar la cantidad de un item en el carrito', async () => {
      // Primero agregar un producto al carrito
      await request(app)
        .post('/api/cart')
        .send(testCartItem);

      // Obtener el ID del item creado
      const cartRes = await request(app).get('/api/cart');
      const itemId = cartRes.body[0].id;

      // Actualizar cantidad
      const res = await request(app)
        .put(`/api/cart/${itemId}`)
        .send({ quantity: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/carrito actualizado/i);
    });

    it('Debe eliminar item si la cantidad es 0 o menor', async () => {
      // Agregar producto al carrito
      await request(app)
        .post('/api/cart')
        .send(testCartItem);

      // Obtener el ID del item
      const cartRes = await request(app).get('/api/cart');
      const itemId = cartRes.body[0].id;

      // Actualizar cantidad a 0
      const res = await request(app)
        .put(`/api/cart/${itemId}`)
        .send({ quantity: 0 });

      expect(res.statusCode).toBe(200);

      // Verificar que el carrito está vacío
      const finalCartRes = await request(app).get('/api/cart');
      expect(finalCartRes.body.length).toBe(0);
    });

    it('Debe eliminar un producto específico del carrito', async () => {
      // Agregar producto al carrito
      await request(app)
        .post('/api/cart')
        .send(testCartItem);

      // Obtener el ID del item
      const cartRes = await request(app).get('/api/cart');
      const itemId = cartRes.body[0].id;

      // Eliminar el item
      const res = await request(app).delete(`/api/cart/${itemId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/producto eliminado/i);

      // Verificar que el carrito está vacío
      const finalCartRes = await request(app).get('/api/cart');
      expect(finalCartRes.body.length).toBe(0);
    });

    it('Debe retornar error 404 al eliminar item inexistente', async () => {
      const res = await request(app).delete('/api/cart/item-inexistente');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/item no encontrado/i);
    });

    it('Debe vaciar completamente el carrito', async () => {
      // Agregar algunos productos al carrito
      await request(app).post('/api/cart').send(testCartItem);
      await request(app).post('/api/cart').send({ productId: '2', quantity: 1 });

      // Vaciar el carrito
      const res = await request(app).delete('/api/cart');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/carrito vaciado/i);

      // Verificar que el carrito está vacío
      const cartRes = await request(app).get('/api/cart');
      expect(cartRes.body.length).toBe(0);
    });
  });

  describe('Validaciones de datos', () => {
    it('Debe manejar datos inválidos en POST /api/cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .send({});
      
      expect(res.statusCode).toBe(404);
    });

    it('Debe manejar cantidad negativa al agregar al carrito', async () => {
      const res = await request(app)
        .post('/api/cart')
        .send({ productId: '1', quantity: -1 });
      
      expect(res.statusCode).toBe(201);
    });
  });
});