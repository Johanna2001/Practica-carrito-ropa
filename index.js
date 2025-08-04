const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

// Archivos JSON que actúan como base de datos
const PRODUCTS_FILE = './products.json';
const CART_FILE = './cart.json';

// Middleware para manejar JSON y archivos estáticos
app.use(express.json());
app.use(express.static('public'));

// Función para leer archivos JSON
const readDatabase = (file) => {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Función para escribir en archivos JSON
const writeDatabase = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
};

// Ruta principal - servir la página web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para obtener todos los productos
app.get('/api/products', (req, res) => {
    const products = readDatabase(PRODUCTS_FILE);
    res.json(products);
});

// API para obtener el carrito
app.get('/api/cart', (req, res) => {
    const cart = readDatabase(CART_FILE);
    res.json(cart);
});

// API para agregar producto al carrito
app.post('/api/cart', (req, res) => {
    const cart = readDatabase(CART_FILE);
    const { productId, quantity = 1 } = req.body;
    const products = readDatabase(PRODUCTS_FILE);
    
    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: Date.now().toString(),
            productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity
        });
    }

    writeDatabase(CART_FILE, cart);
    res.status(201).json({ message: 'Producto agregado al carrito', cart });
});

// API para actualizar cantidad en el carrito
app.put('/api/cart/:id', (req, res) => {
    const cart = readDatabase(CART_FILE);
    const itemId = req.params.id;
    const { quantity } = req.body;

    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item no encontrado en el carrito' });
    }

    if (quantity <= 0) {
        cart.splice(itemIndex, 1);
    } else {
        cart[itemIndex].quantity = quantity;
    }

    writeDatabase(CART_FILE, cart);
    res.json({ message: 'Carrito actualizado', cart });
});

// API para eliminar producto del carrito
app.delete('/api/cart/:id', (req, res) => {
    const cart = readDatabase(CART_FILE);
    const itemId = req.params.id;

    const filteredCart = cart.filter(item => item.id !== itemId);

    if (filteredCart.length === cart.length) {
        return res.status(404).json({ error: 'Item no encontrado en el carrito' });
    }

    writeDatabase(CART_FILE, filteredCart);
    res.json({ message: 'Producto eliminado del carrito' });
});

// API para limpiar el carrito
app.delete('/api/cart', (req, res) => {
    writeDatabase(CART_FILE, []);
    res.json({ message: 'Carrito vaciado' });
});

// API de estado del servidor
app.get('/api/status', (req, res) => {
    res.json({
        message: 'Servidor de carrito de compras ejecutándose en puerto 3001',
        status: 200,
        timestamp: new Date().toISOString()
    });
});

// Exportar para tests
module.exports = app;

// Iniciar el servidor
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor de carrito de compras corriendo en http://0.0.0.0:${PORT}`);
    });
}