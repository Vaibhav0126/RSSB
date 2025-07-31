const fs = require("fs");
const path = require("path");

// Function to extract content from Java Country data files
function extractContentFromJavaFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const entries = [];

  // Regular expression to match Country constructor calls
  const countryRegex =
    /new Country\("([^"]*(?:"[^"]*"[^"]*)*)", "([^"]*(?:"[^"]*"[^"]*)*)"(?:\)\);|\),)/gs;

  let match;
  while ((match = countryRegex.exec(content)) !== null) {
    let title = match[1];
    let description = match[2];

    // Clean up the strings
    title = title
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
    description = description
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

    // Skip if title or description is too short or just punctuation
    if (title.length > 2 && description.length > 2) {
      entries.push({
        title: title.trim(),
        description: description.trim(),
      });
    }
  }

  return entries;
}

// Function to categorize content based on keywords
function categorizeContent(title, description) {
  const text = (title + " " + description).toLowerCase();

  if (text.includes("मंगलाचरण") || text.includes("मंगल")) {
    return "मंगलाचरण";
  } else if (
    text.includes("नाम") &&
    (text.includes("महिमा") || text.includes("गुण"))
  ) {
    return "नाम महिमा";
  } else if (
    text.includes("सतगुरु") ||
    text.includes("गुरु") ||
    text.includes("महाराज")
  ) {
    return "गुरु महिमा";
  } else if (text.includes("सतसंग") || text.includes("संग")) {
    return "सत्संग";
  } else if (
    text.includes("शब्द") ||
    text.includes("धुन") ||
    text.includes("सुरत")
  ) {
    return "शब्द अभ्यास";
  } else if (
    text.includes("भक्ति") ||
    text.includes("प्रेम") ||
    text.includes("भजन")
  ) {
    return "भक्ति";
  } else if (
    text.includes("धाम") ||
    text.includes("लोक") ||
    text.includes("देश")
  ) {
    return "आध्यात्मिक लोक";
  } else if (
    text.includes("जीव") ||
    text.includes("आत्मा") ||
    text.includes("जन्म")
  ) {
    return "आत्मा विज्ञान";
  } else if (
    text.includes("कर्म") ||
    text.includes("करम") ||
    text.includes("कल्") ||
    text.includes("काल")
  ) {
    return "कर्म सिद्धांत";
  } else if (
    text.includes("प्रार्थना") ||
    text.includes("बंदगी") ||
    text.includes("दुआ")
  ) {
    return "प्रार्थना";
  } else {
    return "सामान्य शिक्षा";
  }
}

// Function to extract tags from content
function extractTags(title, description) {
  const text = title + " " + description;
  const tags = new Set();

  // Common spiritual terms that can be tags
  const tagKeywords = [
    "राधास्वामी",
    "सतगुरु",
    "नाम",
    "शब्द",
    "सुरत",
    "धुन",
    "भक्ति",
    "प्रेम",
    "सतसंग",
    "गुरु",
    "महाराज",
    "दयाल",
    "जीव",
    "आत्मा",
    "धाम",
    "लोक",
    "मन",
    "सुमिरन",
    "ध्यान",
    "भजन",
    "कर्म",
    "काल",
    "माया",
    "मुक्ति",
    "आनंद",
    "शांति",
    "सत्य",
    "ज्ञान",
    "विवेक",
    "वैराग्य",
    "तप",
    "संयम",
  ];

  tagKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      tags.add(keyword);
    }
  });

  return Array.from(tags).slice(0, 5); // Limit to 5 tags
}

// Main function to process all files
function extractAllContent() {
  const androidAppPath =
    "../../../app/src/main/java/com/hnlogix/countrysearcapp/";
  const allContent = [];

  // Process all 6 CountryData files
  for (let i = 1; i <= 6; i++) {
    const filePath = path.join(
      __dirname,
      androidAppPath,
      `CountryData${i}.java`
    );

    if (fs.existsSync(filePath)) {
      console.log(`Processing CountryData${i}.java...`);
      const entries = extractContentFromJavaFile(filePath);

      entries.forEach((entry) => {
        const category = categorizeContent(entry.title, entry.description);
        const tags = extractTags(entry.title, entry.description);

        allContent.push({
          title: entry.title,
          description: entry.description,
          category: category,
          tags: tags,
          sourceFile: `CountryData${i}`,
        });
      });

      console.log(
        `  Extracted ${entries.length} entries from CountryData${i}.java`
      );
    } else {
      console.log(`File not found: ${filePath}`);
    }
  }

  console.log(`\nTotal entries extracted: ${allContent.length}`);

  // Save to JSON file for seed script
  const outputPath = path.join(__dirname, "extracted-content.json");
  fs.writeFileSync(outputPath, JSON.stringify(allContent, null, 2), "utf8");
  console.log(`Content saved to: ${outputPath}`);

  // Generate category statistics
  const categoryStats = {};
  allContent.forEach((entry) => {
    categoryStats[entry.category] = (categoryStats[entry.category] || 0) + 1;
  });

  console.log("\nCategory Statistics:");
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count} entries`);
    });

  return allContent;
}

// Run the extraction if this file is executed directly
if (require.main === module) {
  extractAllContent();
}

module.exports = { extractAllContent, categorizeContent, extractTags };
