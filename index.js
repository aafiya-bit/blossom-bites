require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const connectDB = require("./src/config.js");
const User = require("./models/user.js");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const MenuItem = require("./models/menuItem.js");
const session = require("express-session");
const nodemailer = require("nodemailer");
const UserOTPVerification = require("./models/UserOTPVerification.js");
const PDFDocument = require("pdfkit");
const fs = require("fs");


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// --- Middleware ---

// Middleware to authenticate user and attach user data to the request
const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect("/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      res.clearCookie("token");
      return res.redirect("/login");
    }

    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.clearCookie("token");
    res.redirect("/login");
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect("/admin");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user || req.user.role !== "admin") {
      res.clearCookie("token");
      return res.redirect("/admin-login");
    }
    next();
  } catch (err) {
    console.error("Admin authentication error:", err);
    res.clearCookie("token");
    res.redirect("/admin-login");
  }
};

// --- Routes ---

// Signup
app.get("/", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  try {
    let { userName, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send("User already exists. Please choose a different email.");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      userName,
      email,
      password: hashedPassword,

    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.render("home", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error while signing up.");
  }
});

// Login
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new Error("Invalid email or password."));
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log(token);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.render("home", { user });
  } catch (err) {
    next(err);
  }
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});
// home
// app.get("/home", (req, res) => {
//   res.render("home");
// });

// This route now handles the home page and checks for a valid user
app.get("/home", async (req, res) => {
  try {
    // 1. Get the token from the cookies
    const token = req.cookies.token;

    // If no token exists, redirect them to the login page.
    if (!token) {
      return res.redirect("/login");
    }

    // 2. Verify the token to get the user's ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the user in the database using the ID from the token
    const user = await User.findById(decoded.id);

    // If the user is not found, redirect to login.
    if (!user) {
      return res.redirect("/login");
    }

    // 4. Render the home page and pass the user object to it
    res.render("home", { user: user });

  } catch (err) {
    // If the token is invalid or expired, redirect to login
    console.error("Authentication error:", err.message);
    res.redirect("/login");
  }
});
// Admin Login
app.get("/admin-login", (req, res) => {
  res.render("admin");
});


// Admin Login Route (POST)

app.post("/admin-login", async (req, res, next) => {
  try {
    const { email, password, adminKey } = req.body;
    const user = await User.findOne({ email });

    // A. Validate user and credentials
    if (
      !user ||
      user.role !== "admin" ||
      !(await bcrypt.compare(password, user.password)) ||
      adminKey !== process.env.SECURITY_KEY
    ) {
      return next(new Error("Unauthorized access."));
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // B. FIX: Fetch inventory data from the database
    const inventory = await MenuItem.find({});

    // C. FIX: Pass both the 'user' and 'inventory' data to the EJS template
    res.render("adminHome", { user: user, inventory: inventory });

  } catch (err) {
    next(err);
  }
});




// Protected Routes
app.get("/category", auth, (req, res) => {
  res.render("category", { user: req.user });
});

app.get("/drinks", auth, async (req, res) => {
  try {
    const drinkItems = await MenuItem.find({ category: "drinks" });
    res.render("drinks", { items: drinkItems, user: req.user });
  } catch (error) {
    console.error("Error fetching drinks:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/desserts", auth, async (req, res) => {
  try {
    const dessertItems = await MenuItem.find({ category: "desserts" });
    res.render("desserts", { items: dessertItems, user: req.user });
  } catch (error) {
    console.error("Error fetching desserts:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/snacks", auth, async (req, res) => {
  try {
    const snackItems = await MenuItem.find({ category: "snacks" });
    res.render("snacks", { items: snackItems, user: req.user });
  } catch (error) {
    console.error("Error fetching snacks:", error);
    res.status(500).send("Server Error");
  }
});

app.get("/lunch", auth, async (req, res) => {
  try {
    const lunchItems = await MenuItem.find({ category: "lunch" });
    res.render("lunch", { items: lunchItems, user: req.user });
  } catch (error) {
    console.error("Error fetching lunch items:", error);
    res.status(500).send("Server Error");
  }
});

app.post("/add-to-cart/:categoryName", async (req, res) => {
  const { itemId, itemName, itemPrice } = req.body;
  const categoryName = req.params.categoryName;
  const item = await MenuItem.findById(itemId);

  if (!item || item.quantity <= 0) {
    return res.redirect(`/${categoryName}`);
  }

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const existingItem = req.session.cart.find(
    (cartItem) => cartItem._id === itemId
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    req.session.cart.push({
      _id: itemId,
      name: itemName,
      price: parseFloat(itemPrice),
      quantity: 1,
    });
  }
  res.redirect(`/${categoryName}`);
});

app.get("/cart", auth, (req, res) => {
  const cart = req.session.cart || [];
  let subtotal = 0;
  cart.forEach((item) => {
    subtotal += item.price * item.quantity;
  });
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  res.render("cart", {
    cart: cart,
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    user: req.user,
  });
});

// Admin Routes
app.get("/adminDash", adminAuth, (req, res) => {
  res.render("adminDash", { user: req.user });
});

app.get("/add-item", adminAuth, (req, res) => {
  res.render("adminNew", { user: req.user });
});

app.post("/add-item", adminAuth, async (req, res) => {
  try {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    res.redirect("/manage-items");
  } catch (err) {
    console.error("Error adding item:", err);
    res.status(500).send("Error adding item.");
  }
});

app.get("/manage-items", adminAuth, async (req, res) => {
  try {
    const menuItems = await MenuItem.find({});
    res.render("adminMenuM", { items: menuItems, user: req.user });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).send("Error fetching menu items.");
  }
});

app.get("/edit-item/:id", adminAuth, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).send("Item not found.");
    }
    res.render("adminMenuE", { item: item, user: req.user });
  } catch (err) {
    console.error("Error fetching item for edit:", err);
    res.status(500).send("Error fetching item.");
  }
});

app.post("/edit-item/:id", adminAuth, async (req, res) => {
  try {
    await MenuItem.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/manage-items");
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).send("Error updating item.");
  }
});

app.post("/delete-item/:id", adminAuth, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.redirect("/manage-items");
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).send("Error deleting item.");
  }
});

app.get("/manage-users", adminAuth, async (req, res) => {
  try {
    const users = await User.find({});
    res.render("adminManaUsers", { users: users, user: req.user });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Error fetching users.");
  }
});

app.post("/delete-user/:id", adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/manage-users");
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Error deleting user.");
  }
});

// otp email things

const sendOTPVerificationEmail = async ({ _id, email, name }, cart) => {
  try {
    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // --- PDF Bill Generation ---
    const billDir = path.join(__dirname, "public", "bills");
    if (!fs.existsSync(billDir)) fs.mkdirSync(billDir, { recursive: true });
    const pdfPath = path.join(billDir, `bill-${_id}.pdf`);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(fs.createWriteStream(pdfPath));

    // --- Background Image ---
    const bgPath = path.join(__dirname, "public", "images", "bg.jpg");
    if (fs.existsSync(bgPath)) {
      doc.image(bgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    }

    // --- Title with custom cursive font & color ---
    const fontPath = path.join(__dirname, "public", "fonts", "GreatVibes-Regular.ttf");
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    } else {
      doc.font("Helvetica-Bold"); // fallback
    }
    doc.fillColor("#c573a8")
      .fontSize(28)
      .text("Blossom Bites - Bill", { align: "center" });
    doc.moveDown(1);

    // --- User info and Order date/time ---
    const orderDate = new Date();
    doc.font("Helvetica").fontSize(12)
      .fillColor("black")
      .text(`Email: ${email}`, 50, doc.y)
      .text(`Order Date: ${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}`, 50, doc.y);
    doc.moveDown(1.5);

    // --- Table header ---
    const tableTop = doc.y;
    const itemSpacing = 25;
    const colPositions = [50, 150, 320, 390, 460];

    doc.font("Helvetica-Bold").fontSize(14);
    ["S.No", "Item", "Qty", "Price", "Total"].forEach((header, i) => {
      doc.text(header, colPositions[i], tableTop);
    });

    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(12);
    let grandTotal = 0;

    if (cart.length === 0) {
      doc.text("Your cart is empty.", colPositions[0], y);
    } else {
      cart.forEach((item, idx) => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;

        // alternating row background
        if (idx % 2 === 0) {
          doc.rect(45, y - 5, 510, itemSpacing).fillOpacity(0.05).fillAndStroke("#000000", "#000000").fillOpacity(1);
        }

        doc.fillColor("black").text(idx + 1, colPositions[0], y);
        doc.text(item.name, colPositions[1], y, { width: colPositions[2] - colPositions[1] - 10 });
        doc.text(item.quantity, colPositions[2], y);
        doc.text(`₹${item.price.toFixed(2)}`, colPositions[3], y);
        doc.text(`₹${itemTotal.toFixed(2)}`, colPositions[4], y);

        y += itemSpacing;
      });

      // Totals
      const tax = grandTotal * 0.08;
      const finalTotal = grandTotal + tax;
      y += 10;
      doc.moveTo(45, y).lineTo(545, y).stroke();
      y += 10;
      doc.text(`Subtotal: ₹${grandTotal.toFixed(2)}`, 400, y);
      y += 20;
      doc.text(`Tax (8%): ₹${tax.toFixed(2)}`, 400, y);
      y += 20;
      doc.font("Helvetica-Bold").text(`Grand Total: ₹${finalTotal.toFixed(2)}`, 400, y);

      // --- OTP Section ---
      y += 40;
      doc.font("Helvetica").fontSize(16).fillColor("red").text(`Your OTP: ${otp}`, 50, y, { underline: true });

      // --- Wishes / fortune ---
      const wishes = [
        "Thank you for your order! Keep coming back",
        "May your day be as sweet as your dessert!",
        "Eat, enjoy, repeat",
        "Your next treat is waiting for you!"
      ];
      const randomWish = wishes[Math.floor(Math.random() * wishes.length)];
      y += 40;
      doc.font("Helvetica-Oblique").fontSize(12).fillColor("gray").text(randomWish, 50, y, { align: "center" });
    }

    doc.end();

    // --- Store OTP ---
    const hashedOTP = await bcrypt.hash(otp, 10);
    await new UserOTPVerification({
      userId: _id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000,
    }).save();

    // --- Send Email ---
    await mailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Blossom Bites Canteen - Order Confirmation OTP",
      html: `<p>Your OTP to confirm your order is <strong>${otp}</strong>.</p><p>This code is valid for 10 minutes.</p>`,
      attachments: [{ filename: `bill-${_id}.pdf`, path: pdfPath }],
    });

    console.log("OTP and PDF bill sent successfully!");
  } catch (error) {
    console.error("Error sending OTP and PDF:", error);
  }
};

module.exports = sendOTPVerificationEmail;



//*
// Checkout route to initiate OTP
app.post("/checkout", auth, async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (!cart.length) return res.send("Your cart is empty.");

    await sendOTPVerificationEmail(req.user, cart); // <-- pass cart
    res.render("otp-form", { userId: req.user._id });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).send("Error initiating checkout. Please try again.");
  }
});


// OTP verification route for order confirmation
app.post("/verify-order-otp", async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).send("Empty OTP details are not allowed.");
    }

    // Get the latest OTP record for this user
    const userOTPVerificationRecord = await UserOTPVerification.findOne({ userId }).sort({ createdAt: -1 });

    if (!userOTPVerificationRecord) {
      return res.status(400).send("No OTP record found. Please try checking out again.");
    }

    const { expiresAt, otp: hashedOTP } = userOTPVerificationRecord;

    if (expiresAt < Date.now()) {
      await UserOTPVerification.deleteMany({ userId });
      return res.status(400).send("Code has expired. Please try checking out again.");
    }

    const validOTP = await bcrypt.compare(otp, hashedOTP);
    if (!validOTP) {
      return res.status(400).send("Invalid code passed. Check your email.");
    }

    // --- OTP is valid, process the order ---
    console.log(`Order for user ${userId} has been confirmed!`);

    // Clear the user's cart in the session
    req.session.cart = [];

    // Delete the used OTP record from the database
    await UserOTPVerification.deleteMany({ userId });

    res.render("lastScreen");
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).send("Error verifying your order. Please contact support.");
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});


// Start the server
app.listen(process.env.PORT, () => {
  connectDB();
  console.log(`listening to port ${process.env.PORT}`);
});