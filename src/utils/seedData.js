import Product from '../models/productModel.js';
import ProductVariation from '../models/productVariation.js';

const generateRandomPrice = () =>
  Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
const generateRandomStock = () =>
  Math.floor(Math.random() * (100 - 10 + 1)) + 10;

export const seedSampleData = async () => {
  try {
    // Sample products
    const products = [
      {
        product_name: 'Basic T-Shirt',
        description: 'Comfortable cotton t-shirt',
        category: 'men',
        image_url: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
        ],
        type: 'clothing',
      },
      {
        product_name: 'Summer Dress',
        description: 'Light and breezy summer dress',
        category: 'women',
        image_url: [
          'https://images.unsplash.com/photo-1542295669297-4d352b042bca',
          'https://images.unsplash.com/photo-1542295669297-4d352b042bca'
        ],
        type: 'clothing',
      },
      {
        product_name: 'Kids shirt',
        description: 'Cute kids shirt',
        category: 'kids',
        image_url: [
          'https://images.unsplash.com/photo-1544726110-a3bb72254a6b',
          'https://images.unsplash.com/photo-1544726110-a3bb72254a6b'
        ],
        type: 'clothing',
      },
      {
        product_name: "Men's Running Shoes",
        description: "Comfortable men's running shoes",
        category: 'men',
        image_url: [
          'https://images.unsplash.com/photo-1626947346165-4c2288dadc2a',
        ],
        type: 'footwear',
      },
      {
        product_name: "Women's Fashion Shoes",
        description: "Stylish women's shoes",
        category: 'women',
        image_url: [
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa',
        ],
        type: 'footwear',
      },
      {
        product_name: 'Kids Sports Shoes',
        description: 'Durable kids sports shoes',
        category: 'kids',
        image_url: [
          'https://images.unsplash.com/photo-1603808033192-082d6919d3e1',
        ],
        type: 'footwear',
      },
    ];

    const clothingSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const footwearSizes = ['6', '7', '8', '9', '10'];
    const colors = ['white', 'black'];

    // Create products and their variations
    for (const product of products) {
      const createdProduct = await Product.create(product);

      // Select size array based on product type
      const sizes = product.type === 'clothing' ? clothingSizes : footwearSizes;

      // For clothing, create variations with only sizes
      if (product.type === 'clothing') {
        for (const size of sizes) {
          try {
            await ProductVariation.create({
              product_id: createdProduct.id,
              size,
              color: null,
              price: generateRandomPrice(),
              stock: generateRandomStock(),
              image_url: createdProduct.image_url,
            });
          } catch (variationError) {
            console.error(
              `Error creating variation for product ${createdProduct.id}:`,
              variationError
            );
            continue;
          }
        }
      } else {
        // For footwear, create variations with both sizes and colors
        for (const size of sizes) {
          for (const color of colors) {
            try {
              await ProductVariation.create({
                product_id: createdProduct.id,
                size,
                color,
                price: generateRandomPrice(),
                stock: generateRandomStock(),
                image_url: createdProduct.image_url,
              });
            } catch (variationError) {
              console.error(
                `Error creating variation for product ${createdProduct.id}:`,
                variationError
              );
              continue;
            }
          }
        }
      }
    }

    console.log('Sample data generated successfully');
  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error; // Re-throw to handle it in the calling function
  }
};
