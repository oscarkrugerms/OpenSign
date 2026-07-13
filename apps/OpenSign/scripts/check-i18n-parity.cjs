const fs = require("fs");
const path = require("path");

const frontendDir = path.resolve(__dirname, "..");
const englishPath = path.join(
  frontendDir,
  "public",
  "locales",
  "en",
  "translation.json"
);
const portuguesePath = path.join(
  frontendDir,
  "public",
  "locales",
  "pt-BR",
  "translation.json"
);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`JSON_INVALIDO=${filePath}`);
    console.error(error.message);
    process.exitCode = 1;
    return null;
  }
}

function flatten(value, prefix = "", output = {}) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPath = prefix ? `${prefix}.${key}` : key;
      flatten(child, childPath, output);
    }
  } else {
    output[prefix] = value;
  }

  return output;
}

function placeholders(value) {
  if (typeof value !== "string") {
    return [];
  }

  return [...value.matchAll(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g)]
    .map((match) => match[1])
    .sort();
}

function printList(title, values, limit = 100) {
  console.log(`\n===== ${title} =====`);

  if (values.length === 0) {
    console.log("NENHUMA");
    return;
  }

  values.slice(0, limit).forEach((value) => {
    console.log(value);
  });

  if (values.length > limit) {
    console.log(`... MAIS ${values.length - limit}`);
  }
}

const english = readJson(englishPath);
const portuguese = readJson(portuguesePath);

if (!english || !portuguese) {
  process.exit(1);
}

const flatEnglish = flatten(english);
const flatPortuguese = flatten(portuguese);

const englishKeys = Object.keys(flatEnglish);
const portugueseKeys = Object.keys(flatPortuguese);

const missing = englishKeys.filter(
  (key) => !Object.prototype.hasOwnProperty.call(flatPortuguese, key)
);

const extra = portugueseKeys.filter(
  (key) => !Object.prototype.hasOwnProperty.call(flatEnglish, key)
);

const typeMismatch = englishKeys
  .filter((key) => Object.prototype.hasOwnProperty.call(flatPortuguese, key))
  .filter((key) => typeof flatEnglish[key] !== typeof flatPortuguese[key]);

const placeholderMismatch = englishKeys
  .filter((key) => Object.prototype.hasOwnProperty.call(flatPortuguese, key))
  .filter(
    (key) =>
      JSON.stringify(placeholders(flatEnglish[key])) !==
      JSON.stringify(placeholders(flatPortuguese[key]))
  );

const emptyTranslations = portugueseKeys.filter(
  (key) =>
    typeof flatPortuguese[key] === "string" && flatPortuguese[key].trim() === ""
);

const identicalToEnglish = englishKeys.filter(
  (key) =>
    typeof flatEnglish[key] === "string" &&
    flatEnglish[key] === flatPortuguese[key]
);

console.log(`CHAVES_INGLES=${englishKeys.length}`);
console.log(`CHAVES_PT_BR=${portugueseKeys.length}`);
console.log(`CHAVES_FALTANTES=${missing.length}`);
console.log(`CHAVES_EXTRAS=${extra.length}`);
console.log(`TIPOS_INCOMPATIVEIS=${typeMismatch.length}`);
console.log(`PLACEHOLDERS_INCOMPATIVEIS=${placeholderMismatch.length}`);
console.log(`TRADUCOES_VAZIAS=${emptyTranslations.length}`);
console.log(`VALORES_IDENTICOS_AO_INGLES=${identicalToEnglish.length}`);

printList("CHAVES FALTANTES", missing);
printList("CHAVES EXTRAS", extra);
printList("TIPOS INCOMPATIVEIS", typeMismatch);
printList("PLACEHOLDERS INCOMPATIVEIS", placeholderMismatch);
printList("TRADUCOES VAZIAS", emptyTranslations);
printList("VALORES IDENTICOS AO INGLES", identicalToEnglish, 50);

const structuralErrors =
  missing.length +
  extra.length +
  typeMismatch.length +
  placeholderMismatch.length +
  emptyTranslations.length;

if (structuralErrors > 0) {
  console.error(
    `\nRESULTADO=FALHA (${structuralErrors} problema(s) estrutural(is))`
  );
  process.exit(1);
}

console.log("\nRESULTADO=SUCESSO");
