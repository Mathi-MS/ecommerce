import { db, usersTable, categoriesTable, productsTable, faqTable, referralCodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, "admin@elowell.com")).limit(1);
  if (existingAdmin.length === 0) {
    const hashed = await bcrypt.hash("admin123", 10);
    await db.insert(usersTable).values({
      name: "Elowell Admin",
      email: "admin@elowell.com",
      password: hashed,
      role: "admin",
    });
    console.log("Admin user created: admin@elowell.com / admin123");
  }

  // Create categories
  const categoryData = [
    { name: "Oils & Extracts", slug: "oils-extracts", description: "Natural cold-pressed oils and extracts", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
    { name: "Honey & Sweeteners", slug: "honey-sweeteners", description: "Pure raw honey and natural sweeteners", imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400" },
    { name: "Skin Care", slug: "skin-care", description: "Natural skincare products", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
    { name: "Superfoods", slug: "superfoods", description: "Nutritious superfoods and supplements", imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400" },
  ];

  const cats: Record<string, number> = {};
  for (const cat of categoryData) {
    const existing = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, cat.slug)).limit(1);
    if (existing.length === 0) {
      const [c] = await db.insert(categoriesTable).values(cat).returning();
      cats[cat.slug] = c.id;
    } else {
      cats[cat.slug] = existing[0].id;
    }
  }
  console.log("Categories created");

  // Create products
  const productData = [
    {
      name: "Virgin Coconut Oil",
      slug: "virgin-coconut-oil-" + Date.now(),
      description: "Our premium cold-pressed Virgin Coconut Oil is extracted from fresh coconuts without any heat or chemicals. It retains all the natural goodness, vitamins, and minerals. Rich in medium-chain fatty acids (MCFAs), this oil is perfect for cooking, skin care, and hair care. It has a mild, pleasant coconut aroma and taste. Suitable for all skin types and an excellent natural moisturizer.",
      shortDescription: "Cold-pressed pure virgin coconut oil, rich in MCFAs for cooking and skincare",
      price: "599",
      discountPrice: "499",
      categoryId: cats["oils-extracts"],
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600",
        "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600",
        "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600",
      ]),
      stock: 100,
      featured: true,
      referralCode: "COCONUT10",
    },
    {
      name: "Raw Forest Honey",
      slug: "raw-forest-honey-" + Date.now(),
      description: "Sourced directly from pristine forests, our Raw Forest Honey is unprocessed, unpasteurized and free from any additives. Rich in enzymes, antioxidants, and natural pollen, this honey retains all its medicinal properties. Its dark amber color indicates a rich, complex flavor profile. Perfect as a natural sweetener, for skin care, and as a natural remedy.",
      shortDescription: "Unprocessed raw forest honey packed with natural enzymes and antioxidants",
      price: "799",
      discountPrice: "699",
      categoryId: cats["honey-sweeteners"],
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600",
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600",
        "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600",
      ]),
      stock: 80,
      featured: true,
      referralCode: "HONEY10",
    },
    {
      name: "Pure Aloe Vera Gel",
      slug: "pure-aloe-vera-gel-" + Date.now(),
      description: "Our Pure Aloe Vera Gel is extracted from organically grown Aloe Barbadensis plants. 99% pure aloe vera with no added parabens, sulfates, or artificial colors. Deeply hydrating and soothing, it's perfect for skin care, sunburn relief, hair care, and as a natural makeup primer. Suitable for all skin types including sensitive skin.",
      shortDescription: "99% pure organic aloe vera gel for skin and hair care, paraben-free",
      price: "349",
      discountPrice: null,
      categoryId: cats["skin-care"],
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
        "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600",
        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600",
      ]),
      stock: 120,
      featured: true,
      referralCode: null,
    },
    {
      name: "Moringa Leaf Powder",
      slug: "moringa-leaf-powder-" + Date.now(),
      description: "Our Moringa Leaf Powder is made from organically cultivated moringa leaves, dried at low temperatures to preserve nutrients. Known as the 'miracle tree', moringa is incredibly rich in vitamins A, C, E, calcium, potassium, and protein. Add it to smoothies, juices, or food to boost your daily nutrition naturally.",
      shortDescription: "Organic moringa superfood powder packed with vitamins and minerals",
      price: "449",
      discountPrice: "399",
      categoryId: cats["superfoods"],
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600",
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
      ]),
      stock: 90,
      featured: false,
      referralCode: null,
    },
    {
      name: "Black Seed Oil (Kalonji)",
      slug: "black-seed-oil-kalonji-" + Date.now(),
      description: "Our Black Seed Oil is cold-pressed from premium quality Nigella sativa seeds. Known as 'the cure for everything except death' in ancient medicine, black seed oil is rich in thymoquinone and has powerful anti-inflammatory, antioxidant, and immune-boosting properties. Great for skin, hair, and overall wellness.",
      shortDescription: "Cold-pressed kalonji oil with powerful immune-boosting thymoquinone",
      price: "699",
      discountPrice: "599",
      categoryId: cats["oils-extracts"],
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1620454627836-a2e78f9c7b50?w=600",
        "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600",
      ]),
      stock: 60,
      featured: false,
      referralCode: "BLACK15",
    },
    {
      name: "Himalayan Pink Salt",
      slug: "himalayan-pink-salt-" + Date.now(),
      description: "Our Himalayan Pink Salt is hand-mined from ancient sea salt deposits in the Himalayan mountains. It contains over 84 trace minerals including iron, magnesium, potassium, and calcium. Less processed than table salt, it provides a more complex flavor and natural mineral benefits. Available in fine grind perfect for everyday cooking.",
      shortDescription: "Hand-mined Himalayan pink salt with 84+ trace minerals",
      price: "249",
      discountPrice: null,
      categoryId: cats["superfoods"],
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?w=600",
        "https://images.unsplash.com/photo-1533779283484-8ad4a1faefd2?w=600",
      ]),
      stock: 200,
      featured: false,
      referralCode: null,
    },
    {
      name: "Neem Face Wash",
      slug: "neem-face-wash-" + Date.now(),
      description: "Our Neem Face Wash harnesses the powerful antibacterial and antifungal properties of neem to deeply cleanse your skin. Enriched with neem extract, aloe vera, and turmeric, this face wash helps combat acne, reduce dark spots, and leave skin feeling fresh and balanced. Suitable for oily and combination skin types.",
      shortDescription: "Natural neem-based face wash for acne-prone and oily skin",
      price: "299",
      discountPrice: "249",
      categoryId: cats["skin-care"],
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600",
        "https://images.unsplash.com/photo-1603384698858-10e09e4a0025?w=600",
      ]),
      stock: 75,
      featured: false,
      referralCode: null,
    },
    {
      name: "Tulsi & Ginger Honey",
      slug: "tulsi-ginger-honey-" + Date.now(),
      description: "A powerful blend of raw honey infused with fresh tulsi (holy basil) and ginger extract. This traditional Indian remedy is known for its immunity-boosting, anti-inflammatory, and digestive benefits. Perfect for soothing sore throats, boosting immunity during season changes, and as a daily wellness supplement.",
      shortDescription: "Raw honey infused with tulsi and ginger for immunity and wellness",
      price: "549",
      discountPrice: "479",
      categoryId: cats["honey-sweeteners"],
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600",
        "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600",
      ]),
      stock: 50,
      featured: true,
      referralCode: "TULSI10",
    },
  ];

  for (const product of productData) {
    const existing = await db.select().from(productsTable).where(eq(productsTable.name, product.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(productsTable).values(product as Parameters<typeof db.insert>[0] extends infer T ? T extends typeof productsTable ? Parameters<typeof db.insert>[1]["values"] : never : never);
    }
  }
  console.log("Products created");

  // Create FAQs
  const faqData = [
    { question: "Are your products 100% natural?", answer: "Yes, all Elowell products are made from 100% natural ingredients with no artificial additives, preservatives, or chemicals. We source our ingredients from trusted farmers and suppliers who practice sustainable farming.", order: 1 },
    { question: "How do I store these products?", answer: "Most of our products should be stored in a cool, dry place away from direct sunlight. Our oils may solidify in cold temperatures - this is completely normal and does not affect quality. Simply warm the container to liquify.", order: 2 },
    { question: "What is your return policy?", answer: "We offer a 30-day satisfaction guarantee. If you are not satisfied with any product, contact us within 30 days of delivery for a full refund or replacement. Products must be returned in original condition.", order: 3 },
    { question: "Do you offer free shipping?", answer: "Yes! We offer free shipping on all orders above ₹999. For orders below ₹999, a flat shipping fee of ₹79 applies. Standard delivery takes 3-5 business days.", order: 4 },
    { question: "Are your products safe for children?", answer: "Most of our products are safe for children above 2 years. However, we recommend consulting a pediatrician before using any new product on children. Some products like black seed oil should not be used for young children.", order: 5 },
    { question: "Do you ship internationally?", answer: "Currently we ship only within India. We plan to expand to international shipping soon. Sign up for our newsletter to be notified when we launch international shipping.", order: 6 },
    { question: "How can I track my order?", answer: "Once your order is shipped, you will receive an SMS and email with your tracking number. You can track your order on our website or through the courier partner's website.", order: 7 },
    { question: "Are your products tested and certified?", answer: "Yes, all our products are tested in NABL-accredited laboratories for purity and quality. We maintain FSSAI certification for food products and comply with all applicable regulations.", order: 8 },
  ];

  for (const faq of faqData) {
    const existing = await db.select().from(faqTable).where(eq(faqTable.question, faq.question)).limit(1);
    if (existing.length === 0) {
      await db.insert(faqTable).values(faq);
    }
  }
  console.log("FAQs created");

  // Create referral codes
  const referralData = [
    { code: "WELCOME10", discountPercent: "10", isActive: true },
    { code: "ELOWELL15", discountPercent: "15", isActive: true },
    { code: "NATURAL20", discountPercent: "20", maxUsage: 100, isActive: true },
  ];

  for (const ref of referralData) {
    const existing = await db.select().from(referralCodesTable).where(eq(referralCodesTable.code, ref.code)).limit(1);
    if (existing.length === 0) {
      await db.insert(referralCodesTable).values({ ...ref, maxUsage: (ref as Record<string, unknown>).maxUsage as number ?? null });
    }
  }
  console.log("Referral codes created");

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
