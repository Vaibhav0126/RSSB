"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Default admin user
const defaultAdmin = {
    email: "rssbsearch@gmail.com",
    name: "RSSB Admin",
    role: "ADMIN",
};
// Sample users for testing
const sampleUsers = [
    {
        email: "mentor1@rssb.org",
        name: "Mentor Singh",
        role: "MENTOR",
    },
    {
        email: "sk1@rssb.org",
        name: "SK Member",
        role: "SK",
    },
    {
        email: "ask1@rssb.org",
        name: "ASK Member",
        role: "ASK",
    },
    {
        email: "user1@rssb.org",
        name: "Regular User",
        role: "USER",
    },
];
// Sample books (same as before but updated)
const sampleBooks = [
    {
        title: "राधास्वामी नाम की महिमा",
        briefIntro: "यह पुस्तक राधास्वामी नाम के महत्व और उसकी महिमा पर प्रकाश डालती है।",
        content: `This sacred book by Radha Soami Satsang Beas tells us in detail about the glory of Naam (Divine Name). 

सतगुरु की कृपा से जब हमें नाम का दान मिलता है, तो यह हमारे जीवन को पूर्णतः बदल देता है। नाम ही वह शक्ति है जो हमें इस संसार के बंधनों से मुक्त कराकर परमपिता तक पहुंचाती है।

हज़ूर स्वामी जी महाराज के श्री चरणों में यह पुस्तक समर्पित है। इसमें नाम के सार, उसकी शक्ति, और भक्ति के महत्व पर प्रकाश डाला गया है।

मुख्य बिंदु:
- नाम की महिमा और शक्ति
- सतगुरु की कृपा का महत्व  
- भक्ति और सत्संग का फल
- आत्मा की यात्रा और मोक्ष`,
        keywords: [
            "राधास्वामी",
            "नाम",
            "महिमा",
            "सतगुरु",
            "भक्ति",
            "ध्यान",
            "आत्मा",
            "मोक्ष",
        ],
        category: "spiritual",
    },
    {
        title: "The Path of the Masters",
        briefIntro: "A comprehensive guide to the spiritual teachings and practices of Sant Mat.",
        content: `This sacred text illuminates the path of Sant Mat - the teachings of the Saints. It provides detailed guidance on the spiritual journey and the practice of Surat Shabd Yoga.

The book explains:
- The nature of the soul and its relationship with the Supreme Being
- The importance of a living Master (Satguru)
- The practice of meditation and inner spiritual development
- The stages of spiritual evolution
- The ultimate goal of God-realization

Key Teachings:
- All religions essentially teach the same fundamental truths
- The necessity of a competent living Master
- The practice of meditation on the Divine Sound and Light
- The importance of ethical living and selfless service
- The gradual ascent of consciousness through inner spiritual regions

This timeless wisdom guides seekers on their journey from darkness to light, from ignorance to knowledge, and from bondage to liberation.`,
        keywords: [
            "sant mat",
            "spiritual path",
            "meditation",
            "master",
            "guru",
            "soul",
            "god realization",
            "inner light",
            "divine sound",
        ],
        category: "spiritual",
    },
    {
        title: "गुरु की महिमा",
        briefIntro: "सतगुरु के महत्व और उनकी कृपा पर आधारित प्रेरणादायक पुस्तक।",
        content: `यह पुस्तक हमें बताती है कि सतगुरु की महिमा अपार है। वे ही हमारे सच्चे मार्गदर्शक हैं जो हमें अंधकार से प्रकाश की ओर ले जाते हैं।

गुरु और शिष्य का रिश्ता:
गुरु और शिष्य के बीच का बंधन अटूट होता है। यह केवल इस जन्म का नहीं बल्कि कई जन्मों का पुण्य फल है।

गुरु की शिक्षाएं:
- नाम का अभ्यास करना
- सत्संग में भाग लेना  
- नैतिक जीवन जीना
- सेवा और भक्ति करना

सतगुरु की कृपा से ही हम इस भवसागर से पार हो सकते हैं। उनका प्रेम और करुणा हमेशा हमारे साथ रहती है।`,
        keywords: [
            "गुरु",
            "सतगुरु",
            "महिमा",
            "कृपा",
            "शिष्य",
            "भक्ति",
            "प्रेम",
            "मार्गदर्शन",
        ],
        category: "spiritual",
    },
    {
        title: "Meditation Techniques",
        briefIntro: "Practical guidance on meditation practices in the Sant Mat tradition.",
        content: `This manual provides step-by-step instructions for meditation as taught in the Sant Mat tradition. It covers both the theoretical foundation and practical aspects of inner spiritual practice.

Meditation Instructions:
The practice involves concentration at the third eye center, listening to the inner divine sound, and witnessing the inner divine light.

Daily Practice Guidelines:
- Set aside regular time each day for meditation
- Find a quiet, peaceful environment
- Maintain proper posture and mental attitude
- Practice patience and persistence
- Keep a spiritual diary to track progress

Common Challenges and Solutions:
- Dealing with mental restlessness
- Overcoming physical discomfort
- Maintaining regular practice schedule
- Understanding inner experiences
- Developing faith and devotion

The path requires dedication, sincerity, and the grace of a competent Master. With consistent practice and the Master's guidance, the soul gradually awakens to its true divine nature.`,
        keywords: [
            "meditation",
            "techniques",
            "practice",
            "inner light",
            "divine sound",
            "third eye",
            "concentration",
            "spiritual development",
        ],
        category: "meditation",
    },
];
// Sample categories
const categories = [
    {
        name: "spiritual",
        description: "Spiritual teachings and philosophy",
        color: "#7C3AED",
        icon: "🕉️",
    },
    {
        name: "meditation",
        description: "Meditation practices and techniques",
        color: "#059669",
        icon: "🧘",
    },
    {
        name: "satsang",
        description: "Satsang discourses and talks",
        color: "#DC2626",
        icon: "🎤",
    },
    {
        name: "biography",
        description: "Lives of Saints and Masters",
        color: "#EA580C",
        icon: "📖",
    },
    {
        name: "philosophy",
        description: "Spiritual philosophy and principles",
        color: "#0891B2",
        icon: "💭",
    },
];
// Sample notifications
const notifications = [
    {
        title: "Welcome to RSSB Platform",
        message: "Welcome to the enhanced RSSB platform with role-based access and meeting features!",
        type: "INFO",
    },
    {
        title: "New Book Added",
        message: "📚 A new spiritual book has been added to the library",
        type: "BOOK_ADDED",
    },
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🌱 Starting role-based system seeding...");
            // Clear existing data
            yield prisma.notification.deleteMany();
            yield prisma.meeting.deleteMany();
            yield prisma.oTP.deleteMany();
            yield prisma.book.deleteMany();
            yield prisma.user.deleteMany();
            yield prisma.category.deleteMany();
            console.log("🗑️ Cleared existing data");
            // Create default admin user
            console.log("👤 Creating admin user...");
            const admin = yield prisma.user.create({
                data: defaultAdmin,
            });
            // Create sample users
            console.log("👥 Creating sample users...");
            const createdUsers = [];
            for (const user of sampleUsers) {
                const createdUser = yield prisma.user.create({
                    data: Object.assign(Object.assign({}, user), { createdBy: admin.id }),
                });
                createdUsers.push(createdUser);
            }
            // Seed categories
            console.log("📂 Seeding categories...");
            for (const category of categories) {
                yield prisma.category.create({
                    data: category,
                });
            }
            // Seed books
            console.log("📚 Seeding sample books...");
            for (const book of sampleBooks) {
                yield prisma.book.create({
                    data: book,
                });
            }
            // Seed notifications
            console.log("🔔 Seeding notifications...");
            for (const notification of notifications) {
                yield prisma.notification.create({
                    data: notification,
                });
            }
            console.log("✅ Role-based system seeding completed successfully!");
            console.log(`📊 Created:`);
            console.log(`   - 1 admin user (${defaultAdmin.email})`);
            console.log(`   - ${sampleUsers.length} sample users`);
            console.log(`   - ${categories.length} categories`);
            console.log(`   - ${sampleBooks.length} sample books`);
            console.log(`   - ${notifications.length} notifications`);
            console.log("\n🔑 User Roles:");
            console.log("   - ADMIN: Full access, can set mentor roles");
            console.log("   - MENTOR: Can register users, schedule meetings, manage books");
            console.log("   - SK/ASK: Can access meetings and get notifications");
            console.log("   - USER: Library and search access only");
        }
        catch (error) {
            console.error("❌ Error seeding database:", error);
            throw error;
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
