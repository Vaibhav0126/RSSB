"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
// Read the extracted content
const extractedContentPath = path.join(__dirname, "extracted-content.json");
const extractedContent = JSON.parse(fs.readFileSync(extractedContentPath, "utf8"));
// Define categories based on the actual content
const categories = [
    {
        name: "मंगलाचरण",
        description: "मंगलाचरण और शुभारंभ",
        color: "#10B981",
        icon: "🕉️",
    },
    {
        name: "नाम महिमा",
        description: "राधास्वामी नाम की महिमा और गुण",
        color: "#F59E0B",
        icon: "🙏",
    },
    {
        name: "गुरु महिमा",
        description: "सतगुरु की महिमा और शिक्षा",
        color: "#3B82F6",
        icon: "👤",
    },
    {
        name: "सत्संग",
        description: "सत्संग और साधु संगति",
        color: "#8B5CF6",
        icon: "👥",
    },
    {
        name: "शब्द अभ्यास",
        description: "शब्द सुरत योग और अभ्यास",
        color: "#EF4444",
        icon: "📿",
    },
    {
        name: "भक्ति",
        description: "भक्ति, प्रेम और भजन",
        color: "#06B6D4",
        icon: "❤️",
    },
    {
        name: "आध्यात्मिक लोक",
        description: "धाम, लोक और आध्यात्मिक स्थानों का वर्णन",
        color: "#84CC16",
        icon: "🏛️",
    },
    {
        name: "आत्मा विज्ञान",
        description: "जीव, आत्मा और आत्मिक ज्ञान",
        color: "#F97316",
        icon: "✨",
    },
    {
        name: "कर्म सिद्धांत",
        description: "कर्म, काल और कर्म का सिद्धांत",
        color: "#6366F1",
        icon: "⚖️",
    },
    {
        name: "प्रार्थना",
        description: "प्रार्थना, बंदगी और दुआ",
        color: "#EC4899",
        icon: "🙏",
    },
    {
        name: "सामान्य शिक्षा",
        description: "सामान्य आध्यात्मिक शिक्षा और मार्गदर्शन",
        color: "#6B7280",
        icon: "📚",
    },
];
// Sample notifications for RSSB
const notifications = [
    {
        title: "Daily Spiritual Reminder",
        message: "Remember to do your daily meditation and simran practice with devotion and love.",
        type: "spiritual",
    },
    {
        title: "Satsang Schedule",
        message: "Weekly satsang will be held on Sunday at 6 PM. All seekers are welcome to join.",
        type: "announcement",
    },
    {
        title: "Meditation Practice",
        message: "Consistency in daily practice is key to spiritual progress. Set aside time each day for meditation.",
        type: "reminder",
    },
    {
        title: "Master's Teachings",
        message: "Study the teachings of the great Masters regularly to deepen your understanding of the path.",
        type: "spiritual",
    },
    {
        title: "Service Opportunity",
        message: "Voluntary service (seva) opportunities are available. Contact the local center for details.",
        type: "info",
    },
];
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🌱 Starting database seeding with extracted content...");
            // Clear existing data
            yield prisma.notification.deleteMany();
            yield prisma.book.deleteMany();
            console.log("🗑️ Cleared existing data");
            // Note: Categories are now stored as string fields in books
            console.log("📂 Categories will be handled as book metadata...");
            // Seed content from extracted data
            console.log("📚 Seeding spiritual content from extracted data...");
            // Process content in batches to avoid memory issues
            const batchSize = 100;
            let processedCount = 0;
            for (let i = 0; i < extractedContent.length; i += batchSize) {
                const batch = extractedContent.slice(i, i + batchSize);
                for (const item of batch) {
                    try {
                        yield prisma.book.create({
                            data: {
                                title: item.title || "Untitled",
                                briefIntro: item.description || "Spiritual content",
                                content: item.content || item.description || "Spiritual wisdom content",
                                keywords: item.tags || [],
                                category: item.category || "सामान्य शिक्षा",
                            },
                        });
                        processedCount++;
                        // Log progress every 100 items
                        if (processedCount % 100 === 0) {
                            console.log(`   📖 Processed ${processedCount} content items...`);
                        }
                    }
                    catch (error) {
                        console.error(`❌ Error processing item ${processedCount + 1}:`, error);
                        // Continue with next item instead of failing completely
                    }
                }
            }
            // Seed notifications
            console.log("🔔 Seeding notifications...");
            for (const notification of notifications) {
                yield prisma.notification.create({
                    data: {
                        title: notification.title,
                        message: notification.message,
                        type: notification.type, // Type casting for enum
                    },
                });
            }
            console.log("✅ Database seeding completed successfully!");
            console.log(`📊 Final results:`);
            // Get final counts
            const [bookCount, notificationCount] = yield Promise.all([
                prisma.book.count(),
                prisma.notification.count(),
            ]);
            console.log(`   - ${bookCount} books`);
            console.log(`   - ${notificationCount} notifications`);
            // Show category breakdown
            const categoryBreakdown = yield prisma.book.groupBy({
                by: ["category"],
                _count: { category: true },
                orderBy: { _count: { category: "desc" } },
            });
            console.log(`\n📈 Content by category:`);
            categoryBreakdown.forEach((item) => {
                console.log(`   - ${item.category}: ${item._count.category} items`);
            });
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
