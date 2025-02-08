import { Category, Product, ProductVariation } from '../models/index.js';

const generateRandomPrice = () =>
  Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
const generateRandomStock = () =>
  Math.floor(Math.random() * (100 - 10 + 1)) + 10;

export const seedCategories = async () => {
  try {
    // Create root categories - only gender based
    const rootCategories = await Promise.all([
      Category.upsert({ name: 'men', display_name: 'Men' }),
      Category.upsert({ name: 'women', display_name: 'Women' }),
      Category.upsert({ name: 'kids', display_name: 'Kids' })
    ]);

    // Get actual root category records
    const men = await Category.findOne({ where: { name: 'men' } });
    const women = await Category.findOne({ where: { name: 'women' } });
    const kids = await Category.findOne({ where: { name: 'kids' } });

    // Create subcategories for each root category
    const categoryMap = {};

    for (const root of [men, women, kids]) {
      // Create clothing and footwear categories under each root
      const [clothing] = await Category.upsert({
        name: `${root.name}-clothing`,
        display_name: 'Clothes',
        parent_id: root.id
      });

      const [footwear] = await Category.upsert({
        name: `${root.name}-footwear`,
        display_name: 'Shoes',
        parent_id: root.id
      });

      categoryMap[root.name] = {
        root: root.id,
        types: {
          clothing: clothing.id,
          footwear: footwear.id
        }
      };
    }

    console.log('Categories created successfully');
    return categoryMap;
  } catch (error) {
    console.error('Error creating categories:', error);
    throw error;
  }
};

export const seedSampleData = async () => {
  try {
    const categoryMap = await seedCategories();
    
    const products = [
      {
        product_name: 'Men\'s Basic T-Shirt',
        description: 'Comfortable cotton t-shirt',
        category_id: categoryMap.men.types.clothing,
        image_url: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
        ],
        type: 'clothing',
      },
      {
        product_name: 'Women\'s Summer Dress',
        description: 'Light and breezy summer dress',
        category_id: categoryMap.women.types.clothing,
        image_url: [
          'https://images.unsplash.com/photo-1542295669297-4d352b042bca',
        ],
        type: 'clothing',
      },
      {
        product_name: 'Kids Casual Shirt',
        description: 'Cute kids shirt',
        category_id: categoryMap.kids.types.clothing,
        image_url: [
          'https://images.unsplash.com/photo-1544726110-a3bb72254a6b',
        ],
        type: 'clothing',
      },
      {
        product_name: "Men's Running Shoes",
        description: "Comfortable men's running shoes",
        category_id: categoryMap.men.types.footwear,
        image_url: [
          'https://images.unsplash.com/photo-1626947346165-4c2288dadc2a',
        ],
        type: 'footwear',
      },
      // ... rest of the products array
    ];

    const clothingSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const footwearSizes = ['6', '7', '8', '9', '10'];
    const colors = ['white', 'black'];

    // Create products and their variations using upsert
    for (const product of products) {
      const [createdProduct] = await Product.upsert(product, { returning: true });
      
      const sizes = product.type === 'clothing' ? clothingSizes : footwearSizes;
      
      // Create variations with upsert
      if (product.type === 'clothing') {
        for (const size of sizes) {
          const stockQty = generateRandomStock();
          await ProductVariation.upsert({
            product_id: createdProduct.id,
            size,
            color: null,
            price: generateRandomPrice(),
            stock_quantity: stockQty,
            in_stock: stockQty > 0,
            image_url: createdProduct.image_url,
          });
        }
      } else {
        for (const size of sizes) {
          for (const color of colors) {
            const stockQty = generateRandomStock();
            await ProductVariation.upsert({
              product_id: createdProduct.id,
              size,
              color,
              price: generateRandomPrice(),
              stock_quantity: stockQty,
              in_stock: stockQty > 0,
              image_url: createdProduct.image_url,
            });
          }
        }
      }
    }

    console.log('Sample data generated successfully');
  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  }
};
