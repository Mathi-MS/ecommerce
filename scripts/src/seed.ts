import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../artifacts/api-server/.env") });

async function seed() {
  const { connectDB, User, Category, Product, Faq, ReferralCode } = await import("@workspace/db");
  await connectDB();
  console.log("Seeding database...");

  // Admin user
  const existingAdmin = await User.findOne({ email: "admin@elowell.com" });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash("admin123", 10);
    await User.create({ name: "Elowell Admin", email: "admin@elowell.com", password: hashed, role: "admin", isVerified: true });
    console.log("Admin user created: admin@elowell.com / admin123");
  }

  // Default customers
  const customers = [
    { name: "John Doe", email: "john@example.com", password: "john123", phone: "9876543210" },
    { name: "Jane Smith", email: "jane@example.com", password: "jane123", phone: "9876543211" },
  ];
  for (const c of customers) {
    const existing = await User.findOne({ email: c.email });
    if (!existing) {
      const hashed = await bcrypt.hash(c.password, 10);
      await User.create({ ...c, password: hashed, role: "customer", isVerified: true });
      console.log(`Customer created: ${c.email} / ${c.password}`);
    }
  }

  // Categories
  const categoryData = [
    { name: "Oils & Extracts", slug: "oils-extracts", description: "Natural cold-pressed oils and extracts", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
    { name: "Honey & Sweeteners", slug: "honey-sweeteners", description: "Pure raw honey and natural sweeteners", imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400" },
    { name: "Skin Care", slug: "skin-care", description: "Natural skincare products", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
    { name: "Superfoods", slug: "superfoods", description: "Nutritious superfoods and supplements", imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400" },
  ];

  const cats: Record<string, any> = {};
  for (const cat of categoryData) {
    let c = await Category.findOne({ slug: cat.slug });
    if (!c) c = await Category.create(cat);
    cats[cat.slug] = c._id;
  }
  console.log("Categories created");

  // Products
  const productData = [
    { name: "Virgin Coconut Oil", slug: "virgin-coconut-oil-" + Date.now(), description: "Our premium cold-pressed Virgin Coconut Oil is extracted from fresh coconuts without any heat or chemicals.", shortDescription: "Cold-pressed pure virgin coconut oil, rich in MCFAs for cooking and skincare", price: 499, discountPrice: 399, categoryId: cats["oils-extracts"], images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600"], stock: 100, featured: true, referralCode: "COCONUT10" },
    { name: "Raw Forest Honey", slug: "raw-forest-honey-" + Date.now(), description: "Sourced directly from pristine forests, our Raw Forest Honey is unprocessed and unpasteurized.", shortDescription: "Unprocessed raw forest honey packed with natural enzymes and antioxidants", price: 699, discountPrice: 599, categoryId: cats["honey-sweeteners"], images: ["https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600"], stock: 80, featured: true, referralCode: "HONEY10" },
    { name: "Pure Aloe Vera Gel", slug: "pure-aloe-vera-gel-" + Date.now(), description: "Our Pure Aloe Vera Gel is extracted from organically grown Aloe Barbadensis plants. 99% pure.", shortDescription: "99% pure organic aloe vera gel for skin and hair care, paraben-free", price: 349, categoryId: cats["skin-care"], images: ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"], stock: 120, featured: true },
    { name: "Moringa Leaf Powder", slug: "moringa-leaf-powder-" + Date.now(), description: "Our Moringa Leaf Powder is made from organically cultivated moringa leaves.", shortDescription: "Organic moringa superfood powder packed with vitamins and minerals", price: 399, discountPrice: 349, categoryId: cats["superfoods"], images: ["https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600"], stock: 90, featured: false },
    { name: "Black Seed Oil (Kalonji)", slug: "black-seed-oil-kalonji-" + Date.now(), description: "Our Black Seed Oil is cold-pressed from premium quality Nigella sativa seeds.", shortDescription: "Cold-pressed kalonji oil with powerful immune-boosting thymoquinone", price: 599, discountPrice: 499, categoryId: cats["oils-extracts"], images: ["https://images.unsplash.com/photo-1620454627836-a2e78f9c7b50?w=600"], stock: 60, featured: false, referralCode: "BLACK15" },
    { name: "Himalayan Pink Salt", slug: "himalayan-pink-salt-" + Date.now(), description: "Our Himalayan Pink Salt is hand-mined from ancient sea salt deposits.", shortDescription: "Hand-mined Himalayan pink salt with 84+ trace minerals", price: 249, categoryId: cats["superfoods"], images: ["https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?w=600"], stock: 200, featured: false },
    { name: "Neem Face Wash", slug: "neem-face-wash-" + Date.now(), description: "Our Neem Face Wash harnesses the powerful antibacterial properties of neem.", shortDescription: "Natural neem-based face wash for acne-prone and oily skin", price: 249, discountPrice: 199, categoryId: cats["skin-care"], images: ["https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600"], stock: 75, featured: false },
    { name: "Tulsi & Ginger Honey", slug: "tulsi-ginger-honey-" + Date.now(), description: "A powerful blend of raw honey infused with fresh tulsi and ginger extract.", shortDescription: "Raw honey infused with tulsi and ginger for immunity and wellness", price: 479, discountPrice: 399, categoryId: cats["honey-sweeteners"], images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600"], stock: 50, featured: true, referralCode: "TULSI10" },
  ];

  for (const product of productData) {
    const existing = await Product.findOne({ name: product.name });
    if (!existing) await Product.create(product);
  }
  console.log("Products created");

  // FAQs
  const faqData = [
    { question: "Are your products 100% natural?", answer: "Yes, all Elowell products are made from 100% natural ingredients with no artificial additives.", order: 1 },
    { question: "How do I store these products?", answer: "Store in a cool, dry place away from direct sunlight. Oils may solidify in cold temperatures - this is normal.", order: 2 },
    { question: "What is your return policy?", answer: "We offer a 30-day satisfaction guarantee. Contact us within 30 days of delivery for a full refund or replacement.", order: 3 },
    { question: "Do you offer free shipping?", answer: "Yes! Free shipping on all orders above ₹999. Below ₹999, a flat fee of ₹79 applies.", order: 4 },
    { question: "Are your products safe for children?", answer: "Most products are safe for children above 2 years. Consult a pediatrician before use.", order: 5 },
    { question: "Do you ship internationally?", answer: "Currently we ship only within India. International shipping coming soon.", order: 6 },
    { question: "How can I track my order?", answer: "Once shipped, you will receive an SMS and email with your tracking number.", order: 7 },
    { question: "Are your products tested and certified?", answer: "Yes, all products are tested in NABL-accredited laboratories. We maintain FSSAI certification for food products.", order: 8 },
  ];

  for (const faq of faqData) {
    const existing = await Faq.findOne({ question: faq.question });
    if (!existing) await Faq.create(faq);
  }
  console.log("FAQs created");

  // Referral codes
  const referralData = [
    { code: "WELCOME10", discountPercent: 10, isActive: true },
    { code: "ELOWELL15", discountPercent: 15, isActive: true },
    { code: "NATURAL20", discountPercent: 20, maxUsage: 100, isActive: true },
  ];

  for (const ref of referralData) {
    const existing = await ReferralCode.findOne({ code: ref.code });
    if (!existing) await ReferralCode.create(ref);
  }
  console.log("Referral codes created");

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
