import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Admin user with OTP-based login
const adminUser = {
  email: "rssbsearch@gmail.com",
};

// Sample books with spiritual content for testing
const sampleBooks = [
  {
    title: "राधास्वामी नाम की महिमा",
    briefIntro:
      "राधास्वामी नाम का महत्व और इसके जप से होने वाले लाभों का विस्तृत वर्णन।",
    content: `राधास्वामी नाम, जो गावे सोई तरे। कल कलेश सब नाश, सुख पावे सब दुख हरे।

राधास्वामी नाम कुल मालिक का सच्चा और असली नाम है। यह नाम अपार है और इसका कोई भेद नहीं जानता। किंतु जो इसका भेद जान ले, उसे फिर इस संसार में जन्म न लेना होगा।

नाम का स्मरण करने से मन शांत होता है और आत्मा को परमात्मा से मिलने का मार्ग मिलता है। राधास्वामी नाम जपने से सभी पाप नष्ट हो जाते हैं और भक्त को आध्यात्मिक शांति प्राप्त होती है।

This sacred name brings peace to the mind and connects the soul with the divine. Regular meditation on this name removes all sorrows and leads to spiritual enlightenment.`,
    keywords: [
      "राधास्वामी",
      "नाम",
      "महिमा",
      "spiritual",
      "name",
      "meditation",
      "जप",
      "स्मरण",
    ],
    category: "नाम महिमा",
  },
  {
    title: "Spiritual Meditation and Inner Peace",
    briefIntro:
      "A comprehensive guide to achieving inner peace through spiritual meditation practices.",
    content: `Meditation is the key to unlocking the mysteries of the inner self. Through regular practice of spiritual meditation, one can achieve a state of profound peace and understanding.

The path to spiritual enlightenment begins with the practice of meditation. When we sit in quiet contemplation and focus our minds on the divine name, we begin to experience the true nature of our soul.

आंतरिक शांति प्राप्त करने के लिए ध्यान अत्यंत महत्वपूर्ण है। जब हम मन को एकाग्र करके परमात्मा के नाम का जप करते हैं, तो हमें आध्यात्मिक अनुभव होते हैं।

Regular practice leads to:
- Inner peace and tranquility
- Connection with the divine
- Release from worldly attachments
- Spiritual wisdom and understanding

मन की शांति और आत्मा का कल्याण इसी मार्ग से संभव है।`,
    keywords: [
      "meditation",
      "peace",
      "spiritual",
      "ध्यान",
      "शांति",
      "आध्यात्मिक",
      "inner",
      "divine",
    ],
    category: "spiritual",
  },
  {
    title: "गुरु की कृपा और शिष्य का धर्म",
    briefIntro: "सच्चे गुरु की पहचान और शिष्य के कर्तव्यों का वर्णन।",
    content: `गुरु वो है जो अंधकार से प्रकाश की ओर ले जाए। सच्चा गुरु वही है जो शिष्य को आध्यात्मिक मार्ग दिखाए और परमात्मा से मिलाने का उपाय बताए।

गुरु के बिना आध्यात्मिक यात्रा संभव नहीं है। गुरु की कृपा से ही शिष्य को सच्चे ज्ञान की प्राप्ति होती है।

शिष्य का धर्म है:
- गुरु की पूर्ण श्रद्धा और विश्वास
- नियमित सुमिरन और भजन
- सत्संग में नियमित उपस्थिति
- गुरु की आज्ञा का पालन

The guru is the light that guides us from darkness to enlightenment. Without the grace of a true spiritual master, the journey towards God-realization cannot be completed.

गुरु की कृपा से ही मोक्ष संभव है और आत्मा को परमधाम की प्राप्ति होती है।`,
    keywords: [
      "गुरु",
      "कृपा",
      "शिष्य",
      "guru",
      "grace",
      "disciple",
      "spiritual",
      "master",
      "ज्ञान",
    ],
    category: "spiritual",
  },
  {
    title: "परमधाम की यात्रा",
    briefIntro:
      "आत्मा की आध्यात्मिक यात्रा और परमधाम तक पहुंचने के मार्ग का वर्णन।",
    content: `परमधाम वह स्थान है जहां सभी आत्माओं का मूल निवास है। यह यात्रा केवल सच्चे गुरु की कृपा से ही संभव है।

आध्यात्मिक यात्रा के चरण:
1. सुरत का शब्द से मिलन
2. मन के विकारों से मुक्ति
3. आंतरिक प्रकाश का दर्शन
4. आध्यात्मिक स्वर्गों की यात्रा
5. परमधाम में वापसी

The journey to the supreme realm (Param Dham) is the ultimate goal of every soul. This spiritual journey requires complete surrender to the divine will and regular practice of meditation.

Through the practice of spiritual meditation, the soul gradually ascends through various spiritual planes until it reaches its original home in the highest spiritual realm.

यह यात्रा आसान नहीं है, लेकिन गुरु की कृपा और नियमित अभ्यास से यह संभव है। राधास्वामी नाम का जप इस यात्रा का मुख्य साधन है।`,
    keywords: [
      "परमधाम",
      "यात्रा",
      "आत्मा",
      "spiritual",
      "journey",
      "soul",
      "realm",
      "meditation",
      "राधास्वामी",
    ],
    category: "धाम वर्णन",
  },
];

// Sample categories
const categories = [
  {
    name: "मंगल",
    description: "मंगलाचरण और शुभारंभ",
    color: "#10B981",
    icon: "🕉️",
  },
  {
    name: "नाम महिमा",
    description: "राधास्वामी नाम की महिमा",
    color: "#F59E0B",
    icon: "🙏",
  },
  {
    name: "नाम विज्ञान",
    description: "नाम के आध्यात्मिक रहस्य",
    color: "#3B82F6",
    icon: "📿",
  },
  {
    name: "जन्म सुधार",
    description: "जीवन को सुधारने के उपाय",
    color: "#8B5CF6",
    icon: "✨",
  },
  {
    name: "धाम वर्णन",
    description: "परम धाम का वर्णन",
    color: "#EF4444",
    icon: "🏛️",
  },
];

// Sample notifications - only book-related
const notifications = [
  {
    title: "Library Initialized",
    message: "📚 Spiritual library has been set up with sample books",
    type: "book_added",
  },
  {
    title: "Books Available",
    message: "🙏 Ready to explore spiritual teachings and wisdom",
    type: "info",
  },
];

async function main() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data
    await prisma.oTP.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.book.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.category.deleteMany();

    console.log("🗑️ Cleared existing data");

    // Create admin user
    console.log("👤 Creating admin user...");
    await prisma.admin.create({
      data: {
        email: adminUser.email,
      },
    });

    // Seed categories
    console.log("📂 Seeding categories...");
    for (const category of categories) {
      await prisma.category.create({
        data: category,
      });
    }

    // Seed sample books
    console.log("📚 Seeding sample books...");
    for (const book of sampleBooks) {
      await prisma.book.create({
        data: book,
      });
    }

    // Seed notifications
    console.log("🔔 Seeding notifications...");
    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification,
      });
    }

    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Created:`);
    console.log(`   - 1 admin user (email: ${adminUser.email})`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${sampleBooks.length} sample books`);
    console.log(`   - ${notifications.length} notifications`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
