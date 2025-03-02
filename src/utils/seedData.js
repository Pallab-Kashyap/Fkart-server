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
      // Create main categories (clothing and footwear)
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

      // Create clothing subcategories
      const clothingSubcategories = await Promise.all([
        Category.upsert({
          name: `${root.name}-shirts`,
          display_name: 'Shirts',
          parent_id: clothing.id
        }),
        Category.upsert({
          name: `${root.name}-tshirts`,
          display_name: 'T-Shirts',
          parent_id: clothing.id
        }),
        Category.upsert({
          name: `${root.name}-pants`,
          display_name: 'Pants',
          parent_id: clothing.id
        }),
        Category.upsert({
          name: `${root.name}-jackets`,
          display_name: 'Jackets',
          parent_id: clothing.id
        })
      ]);

      // Create footwear subcategories
      const footwearSubcategories = await Promise.all([
        Category.upsert({
          name: `${root.name}-running`,
          display_name: 'Running Shoes',
          parent_id: footwear.id
        }),
        Category.upsert({
          name: `${root.name}-sneakers`,
          display_name: 'Sneakers',
          parent_id: footwear.id
        }),
        Category.upsert({
          name: `${root.name}-sports`,
          display_name: 'Sports Shoes',
          parent_id: footwear.id
        })
      ]);

      categoryMap[root.name] = {
        root: root.id,
        clothing: {
          main: clothing.id,
          shirts: clothingSubcategories[0][0].id,
          tshirts: clothingSubcategories[1][0].id,
          pants: clothingSubcategories[2][0].id,
          jackets: clothingSubcategories[3][0].id
        },
        footwear: {
          main: footwear.id,
          running: footwearSubcategories[0][0].id,
          sneakers: footwearSubcategories[1][0].id,
          sports: footwearSubcategories[2][0].id
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
      // Men's Clothing
      {
        product_name: 'Men\'s Formal Shirt',
        description: 'Classic cotton formal shirt',
        category_id: categoryMap.men.clothing.shirts,
        image_url: ['https://media.istockphoto.com/id/694184272/photo/handsome-young-man-wearing-a-formal-dress.jpg?s=1024x1024&w=is&k=20&c=S3Ot7aqjtZ6MPMiMttSd3sOA_3xKx6lrUHwN4LUGDf4='],
        type: 'clothing',
      },
      {
        product_name: 'Men\'s Casual T-Shirt',
        description: 'Comfortable cotton t-shirt',
        category_id: categoryMap.men.clothing.tshirts,
        image_url: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab'],
        type: 'clothing',
      },
      {
        product_name: 'Men\'s Cargo Pants',
        description: 'Durable cargo pants',
        category_id: categoryMap.men.clothing.pants,
        image_url: ['https://media.istockphoto.com/id/1461845268/photo/catalogue-fashion-studio-shoot-men-legs-in-cargo-trousers.jpg?s=1024x1024&w=is&k=20&c=yFomW001OgwpNtLKkRweKRG2O4AF45cI7JXox7GJdHA='],
        type: 'clothing',
      },
      
      // Men's Footwear
      {
        product_name: 'Men\'s Running Shoes',
        description: 'Professional running shoes',
        category_id: categoryMap.men.footwear.running,
        image_url: ['https://media.istockphoto.com/id/953795296/photo/close-up-view-of-black-sport-running-and-fitness-shoe-sneakers-or-trainers-isolated-on-a-white.jpg?s=1024x1024&w=is&k=20&c=cKooUvB1asCmBxrtzSfh_WqPkXQgSE1Sm8SZoxz140k='],
        type: 'footwear',
      },
      {
        product_name: 'Men\'s Casual Sneakers',
        description: 'Trendy casual sneakers',
        category_id: categoryMap.men.footwear.sneakers,
        image_url: ['https://images.unsplash.com/photo-1715693754067-8a0b8fc4c230'],
        type: 'footwear',
      },

      // Women's Clothing
      {
        product_name: 'Women\'s Formal Shirt',
        description: 'Professional formal shirt',
        category_id: categoryMap.women.clothing.shirts,
        image_url: ["https://media.istockphoto.com/id/1183791223/photo/european-lady-in-spectacles-standing-with-crossed-arms-showing-interest-and-ready-to-help.jpg?s=612x612&w=0&k=20&c=Zk8D7wHP7yz8kanWgmKgSNWIXPCyNKefntiimbp5uhM="],
        type: 'clothing',
      },
      {
        product_name: 'Women\'s Designer T-Shirt',
        description: 'Fashionable t-shirt',
        category_id: categoryMap.women.clothing.tshirts,
        image_url: ['https://media.istockphoto.com/id/2182436583/photo/photo-of-gorgeous-satisfied-optimistic-girl-with-straight-hairdo-dressed-striped-t-shirt.jpg?s=612x612&w=0&k=20&c=BCiHrqVjQXSrgWLWaB-S6J_aStItyeiRtB4_Q4EE0n0='],
        type: 'clothing',
      },

      // Women's Footwear
      {
        product_name: 'Women\'s Running Shoes',
        description: 'Lightweight running shoes',
        category_id: categoryMap.women.footwear.running,
        image_url: ['https://images.unsplash.com/photo-1739138053555-13321c306033'],
        type: 'footwear',
      },

      // Kids' Clothing
      {
        product_name: 'Kids Shirt',
        description: 'Comfortable shirt',
        category_id: categoryMap.kids.clothing.shirts,
        image_url: ['https://media.istockphoto.com/id/1370558562/photo/portrait-of-attractive-young-school-boy-white-background-stock-photo.jpg?s=1024x1024&w=is&k=20&c=fqb2i5wFbhqaTPuBBFJjLCbjHPUlMvabFeFZgsDoTd8='],
        type: 'clothing',
      },
      {
        product_name: 'Kids Sports T-Shirt',
        description: 'Athletic t-shirt for kids',
        category_id: categoryMap.kids.clothing.tshirts,
        image_url: ['https://media.istockphoto.com/id/1073644414/photo/adorable-young-teenage-boy-waist-up-studio-portrait-isolated-over-white-background-handsome.jpg?s=612x612&w=0&k=20&c=ZK9XWuYLC9eeei6cWCHkkIM1hio8xK4RL42GSV4dhQE='],
        type: 'clothing',
      },

      // Kids' Footwear
      {
        product_name: 'Kids Sports Shoes',
        description: 'Durable sports shoes for kids',
        category_id: categoryMap.kids.footwear.sports,
        image_url: ['https://media.istockphoto.com/id/1486760813/photo/white-childrens-sneakers-on-a-pink-background-with-copy-space-banner.jpg?s=612x612&w=0&k=20&c=YeOaR3FUXtBj5tlu62LOLEaifAGU7pGq0O_mPIhVcOM='],
        type: 'footwear',
      },
      {
        product_name: 'Kids Casual Sneakers',
        description: 'Comfortable casual sneakers',
        category_id: categoryMap.kids.footwear.sneakers,
        image_url: ['https://media.istockphoto.com/id/522628236/photo/little-girl-sneakers-shoes.jpg?s=612x612&w=0&k=20&c=JT7FEcRZNzOaAwDoFldcp5iymPU8hJ8Yt-WFvKZpcvw='],
        type: 'footwear',
      }
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
