import { Category, Product, ProductVariation } from '../models/index.js';

const generateRandomPrice = () =>
  Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
const generateRandomStock = () =>
  Math.floor(Math.random() * (100 - 10 + 1)) + 10;

// New function to seed categories
export const seedCategories = async () => {
  try {
    // Create root categories
    const rootCategories = await Promise.all([
      Category.create({ name: 'clothing', display_name: 'Clothing' }),
      Category.create({ name: 'footwear', display_name: 'Footwear' })
    ]);

    const subCategories = [
      { name: 'men', display: 'Men' }, 
      { name: 'women', display: 'Women' }, 
      { name: 'kids', display: 'Kids' }
    ];
    const categoryMap = {};

    for (const rootCategory of rootCategories) {
      categoryMap[rootCategory.name] = {
        root: rootCategory.id,
        subs: {}
      };
      
      for (const sub of subCategories) {
        const subCategory = await Category.create({
          name: `${rootCategory.name}-${sub.name}`,
          display_name: sub.display,
          parent_id: rootCategory.id
        });
        categoryMap[rootCategory.name].subs[sub.name] = subCategory.id;
      }
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
    console.log(categoryMap);
    // Updated sample products with category mapping
    const products = [
      {
        product_name: 'Basic T-Shirt',
        description: 'Comfortable cotton t-shirt',
        category_id: categoryMap.clothing.subs.men,
        image_url: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
        ],
        type: 'clothing',
      },
      {
        product_name: 'Summer Dress',
        description: 'Light and breezy summer dress',
        category_id: categoryMap.clothing.subs.women,
        image_url: [
          'https://images.unsplash.com/photo-1542295669297-4d352b042bca',
          'https://images.unsplash.com/photo-1542295669297-4d352b042bca'
        ],
        type: 'clothing',
      },
      {
        product_name: 'Kids shirt',
        description: 'Cute kids shirt',
        category_id: categoryMap.clothing.subs.kids,
        image_url: [
          'https://images.unsplash.com/photo-1544726110-a3bb72254a6b',
          'https://images.unsplash.com/photo-1544726110-a3bb72254a6b'
        ],
        type: 'clothing',
      },
      {
        product_name: "Men's Running Shoes",
        description: "Comfortable men's running shoes",
        category_id: categoryMap.footwear.subs.men,
        image_url: [
          'https://images.unsplash.com/photo-1626947346165-4c2288dadc2a',
        ],
        type: 'footwear',
      },
      {
        product_name: "Women's Fashion Shoes",
        description: "Stylish women's shoes",
        category_id: categoryMap.footwear.subs.women,
        image_url: [
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa',
        ],
        type: 'footwear',
      },
      {
        product_name: 'Kids Sports Shoes',
        description: 'Durable kids sports shoes',
        category_id: categoryMap.footwear.subs.kids,
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
              stock_quantity: generateRandomStock(), // Changed from stock to stock_quantity
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
                stock_quantity: generateRandomStock(), // Changed from stock to stock_quantity
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
