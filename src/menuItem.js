const mongoose = require("mongoose");
const MenuItem = require("../models/menuItem");

mongoose.connect("mongodb://localhost:27017/CanteenManagement", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const menuItems = [
  // Drinks
  {
    name: "Iced Coffee",
    description: "Chilled coffee with milk",
    price: 300,
    image: "/images/icedCoffee.jpg",
    category: "drinks",
    quantity: 20,
  },
  {
    name: "Fruit Smoothie",
    description: "Blended fruits with yogurt",
    image: "/images/FruitSmoothie.jpg",
    price: 400,
    category: "drinks",
    quantity: 15,
  },
  {
    name: "Hot Chocolate",
    description: "Rich chocolate with whipped cream",
    price: 550,
    image: "/images/HotChocolate.jpg",
    category: "drinks",
    quantity: 10,
  },
  {
    name: "Fresh Lemonade",
    description: "Freshly squeezed lemons with mint",
    price: 200,
    image: "/images/FreshLemonade.jpg",
    category: "drinks",
    quantity: 25,
  },
  {
    name: "Cold Brew",
    description: "Slow-brewed coffee served chilled",
    price: 350,
    image: "/images/ColdBrew.jpg",
    category: "drinks",
    quantity: 15,
  },
  {
    name: "Green Tea",
    description: "Refreshing antioxidant-rich tea",
    price: 180,
    image: "/images/GreenTea.jpg",
    category: "drinks",
    quantity: 30,
  },

  // Snacks
  {
    name: "French Fries",
    description: "Crispy golden fries with seasoning",
    price: 250,
    image: "/images/FrenchFries.jpg",
    category: "snacks",
    quantity: 50,
  },
  {
    name: "Veg Puffs",
    description: "Flaky pastry with vegetable filling",
    price: 300,
    image: "/images/VegPuffs.jpg",
    category: "snacks",
    quantity: 40,
  },
  {
    name: "Sandwich",
    description: "Fresh vegetables in multi-grain bread",
    price: 350,
    image: "/images/Sandwich.jpg",
    category: "snacks",
    quantity: 30,
  },
  {
    name: "Samosa",
    description: "Spiced potato filling in a crispy shell",
    price: 200,
    image: "/images/Samosa.jpg",
    category: "snacks",
    quantity: 60,
  },
  {
    name: "Cheese Balls",
    description: "Golden fried cheese-filled balls",
    price: 280,
    image: "/images/CheeseBalls.jpg",
    category: "snacks",
    quantity: 35,
  },
  {
    name: "Paneer Pakora",
    description: "Crispy fried paneer fritters",
    price: 180,
    image: "/images/PaneerPakora.jpg",
    category: "snacks",
    quantity: 40,
  },

  // Desserts
  {
    name: "Chocolate Cake",
    description: "Rich chocolate cake with frosting",
    price: 450,
    image: "/images/Chocolatecake.jpg",
    category: "desserts",
    quantity: 20,
  },
  {
    name: "Ice Cream Sundae",
    description: "Vanilla ice cream with toppings",
    price: 400,
    image: "/images/IceCreameSundae.jpg",
    category: "desserts",
    quantity: 30,
  },
  {
    name: "Fruit Salad",
    description: "Fresh seasonal fruits with honey",
    price: 300,
    image: "/images/FruitSalad.jpg",
    category: "desserts",
    quantity: 25,
  },
  {
    name: "Brownie",
    description: "Chocolatey and fudgy baked brownie",
    price: 250,
    image: "/images/Brownie.jpg",
    category: "desserts",
    quantity: 20,
  },
  {
    name: "Gulab Jamun",
    description: "Soft milk dumplings in sweet syrup",
    price: 180,
    image: "/images/GulabJamun.jpg",
    category: "desserts",
    quantity: 20,
  },
  {
    name: "Cheesecake",
    description: "Creamy cheesecake with a buttery crust",
    price: 350,
    image: "/images/Cheesecake.jpg",
    category: "desserts",
    quantity: 20,
  },

  // Lunch
  {
    name: "Pasta",
    description: "Penne pasta in tomato sauce",
    price: 500,
    image: "/images/Pasta.jpg",
    category: "lunch",
    quantity: 20,
  },
  {
    name: "Pizza",
    description: "Margherita pizza with fresh basil",
    price: 600,
    image: "/images/Pizza.jpg",
    category: "lunch",
    quantity: 15,
  },
  {
    name: "Burger Meal",
    description: "Veg burger with fries and drink",
    price: 550,
    image: "/images/Burgermeal.jpg",
    category: "lunch",
    quantity: 25,
  },
  {
    name: "Paneer Butter Masala",
    description: "Creamy paneer curry served with naan",
    price: 450,
    image: "/images/PaneerButterMasala.jpg",
    category: "lunch",
    quantity: 20,
  },
  {
    name: "Veg Biryani",
    description: "Fragrant rice with mixed vegetables and spices",
    price: 400,
    image: "/images/VegBiryani.jpg",
    category: "lunch",
    quantity: 20,
  },
  {
    name: "Mixed Veg Curry",
    description: "Seasonal vegetables cooked in flavorful gravy",
    price: 350,
    image: "/images/MixedVegCurry.jpg",
    category: "lunch",
    quantity: 20,
  },
];

// Insert into DB
MenuItem.insertMany(menuItems)
  .then(() => {
    console.log("Menu items inserted successfully!");
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("Error inserting menu items:", err);
  });
