function normalizeStructuredValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ");
}

function createOption(label) {
  return {
    label,
    value: normalizeStructuredValue(label)
  };
}

export const CATEGORY_OPTIONS = [
  "Technology",
  "Agriculture",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Food & Beverage",
  "Energy",
  "Transportation",
  "Real Estate",
  "Tourism & Hospitality",
  "Media & Entertainment",
  "Fashion & Clothing",
  "Construction",
  "Logistics",
  "E-commerce",
  "Non-profit / Social Impact"
].map(createOption);

export const INDUSTRY_OPTIONS = [
  "SaaS",
  "Fintech",
  "Edtech",
  "Healthtech",
  "AgriTech",
  "E-commerce",
  "Marketplace",
  "FMCG",
  "Clothing / Apparel",
  "Restaurant / Food Chain",
  "Manufacturing",
  "Handicraft",
  "Travel & Tourism",
  "Logistics",
  "AI / ML",
  "Blockchain",
  "Cybersecurity",
  "Hardware / IoT",
  "Renewable Energy"
].map(createOption);

export const NEPAL_LOCATION_TREE = [
  {
    label: "Koshi",
    value: "koshi",
    districts: [
      { label: "Bhojpur", value: "bhojpur", cities: [{ label: "Bhojpur Municipality", value: "bhojpur municipality" }, { label: "Shadananda", value: "shadananda" }] },
      { label: "Dhankuta", value: "dhankuta", cities: [{ label: "Dhankuta Municipality", value: "dhankuta municipality" }, { label: "Pakhribas", value: "pakhribas" }] },
      { label: "Ilam", value: "ilam", cities: [{ label: "Ilam Municipality", value: "ilam municipality" }, { label: "Deumai", value: "deumai" }, { label: "Suryodaya", value: "suryodaya" }] },
      { label: "Jhapa", value: "jhapa", cities: [{ label: "Bhadrapur", value: "bhadrapur" }, { label: "Damak", value: "damak" }, { label: "Mechinagar", value: "mechinagar" }, { label: "Birtamod", value: "birtamod" }] },
      { label: "Khotang", value: "khotang", cities: [{ label: "Diktel Rupakot Majhuwagadhi", value: "diktel rupakot majhuwagadhi" }, { label: "Halesi Tuwachung", value: "halesi tuwachung" }] },
      { label: "Morang", value: "morang", cities: [{ label: "Biratnagar", value: "biratnagar" }, { label: "Belbari", value: "belbari" }, { label: "Sundarharaicha", value: "sundarharaicha" }, { label: "Urlabari", value: "urlabari" }] },
      { label: "Okhaldhunga", value: "okhaldhunga", cities: [{ label: "Siddhicharan", value: "siddhicharan" }, { label: "Molung", value: "molung" }] },
      { label: "Panchthar", value: "panchthar", cities: [{ label: "Phidim", value: "phidim" }, { label: "Falelung", value: "falelung" }] },
      { label: "Sankhuwasabha", value: "sankhuwasabha", cities: [{ label: "Khandbari", value: "khandbari" }, { label: "Chainpur", value: "chainpur" }] },
      { label: "Solukhumbu", value: "solukhumbu", cities: [{ label: "Solu Dudhkunda", value: "solu dudhkunda" }, { label: "Khumbu Pasanglhamu", value: "khumbu pasanglhamu" }] },
      { label: "Sunsari", value: "sunsari", cities: [{ label: "Inaruwa", value: "inaruwa" }, { label: "Itahari", value: "itahari" }, { label: "Dharan", value: "dharan" }, { label: "Duhabi", value: "duhabi" }] },
      { label: "Taplejung", value: "taplejung", cities: [{ label: "Phungling", value: "phungling" }, { label: "Meringden", value: "meringden" }] },
      { label: "Terhathum", value: "terhathum", cities: [{ label: "Myanglung", value: "myanglung" }, { label: "Aathrai", value: "aathrai" }] },
      { label: "Udayapur", value: "udayapur", cities: [{ label: "Triyuga", value: "triyuga" }, { label: "Katari", value: "katari" }, { label: "Chaudandigadhi", value: "chaudandigadhi" }] }
    ]
  },
  {
    label: "Madhesh",
    value: "madhesh",
    districts: [
      { label: "Bara", value: "bara", cities: [{ label: "Kalaiya", value: "kalaiya" }, { label: "Simraungadh", value: "simraungadh" }, { label: "Jitpur Simara", value: "jitpur simara" }] },
      { label: "Dhanusha", value: "dhanusha", cities: [{ label: "Janakpurdham", value: "janakpurdham" }, { label: "Mithila", value: "mithila" }, { label: "Ganeshman Charnath", value: "ganeshman charnath" }] },
      { label: "Mahottari", value: "mahottari", cities: [{ label: "Jaleshwar", value: "jaleshwar" }, { label: "Bardibas", value: "bardibas" }, { label: "Gaushala", value: "gaushala" }] },
      { label: "Parsa", value: "parsa", cities: [{ label: "Birgunj", value: "birgunj" }, { label: "Pokhariya", value: "pokhariya" }, { label: "Bahudarmai", value: "bahudarmai" }] },
      { label: "Rautahat", value: "rautahat", cities: [{ label: "Gaur", value: "gaur" }, { label: "Chandrapur", value: "chandrapur" }, { label: "Garuda", value: "garuda" }] },
      { label: "Saptari", value: "saptari", cities: [{ label: "Rajbiraj", value: "rajbiraj" }, { label: "Kanchanrup", value: "kanchanrup" }, { label: "Shambhunath", value: "shambhunath" }] },
      { label: "Sarlahi", value: "sarlahi", cities: [{ label: "Malangwa", value: "malangwa" }, { label: "Hariwan", value: "hariwan" }, { label: "Lalbandi", value: "lalbandi" }] },
      { label: "Siraha", value: "siraha", cities: [{ label: "Siraha", value: "siraha" }, { label: "Lahan", value: "lahan" }, { label: "Dhangadhimai", value: "dhangadhimai" }] }
    ]
  },
  {
    label: "Bagmati",
    value: "bagmati",
    districts: [
      { label: "Bhaktapur", value: "bhaktapur", cities: [{ label: "Bhaktapur", value: "bhaktapur" }, { label: "Madhyapur Thimi", value: "madhyapur thimi" }, { label: "Suryabinayak", value: "suryabinayak" }] },
      { label: "Chitwan", value: "chitwan", cities: [{ label: "Bharatpur", value: "bharatpur" }, { label: "Ratnanagar", value: "ratnanagar" }, { label: "Khairahani", value: "khairahani" }] },
      { label: "Dhading", value: "dhading", cities: [{ label: "Nilkantha", value: "nilkantha" }, { label: "Khaniyabas", value: "khaniyabas" }] },
      { label: "Dolakha", value: "dolakha", cities: [{ label: "Bhimeshwar", value: "bhimeshwar" }, { label: "Jiri", value: "jiri" }] },
      { label: "Kathmandu", value: "kathmandu", cities: [{ label: "Kathmandu", value: "kathmandu" }, { label: "Kirtipur", value: "kirtipur" }, { label: "Tokha", value: "tokha" }, { label: "Budhanilkantha", value: "budhanilkantha" }] },
      { label: "Kavrepalanchok", value: "kavrepalanchok", cities: [{ label: "Dhulikhel", value: "dhulikhel" }, { label: "Banepa", value: "banepa" }, { label: "Panauti", value: "panauti" }] },
      { label: "Lalitpur", value: "lalitpur", cities: [{ label: "Lalitpur", value: "lalitpur" }, { label: "Godawari", value: "godawari" }, { label: "Mahalaxmi", value: "mahalaxmi" }] },
      { label: "Makwanpur", value: "makwanpur", cities: [{ label: "Hetauda", value: "hetauda" }, { label: "Thaha", value: "thaha" }] },
      { label: "Nuwakot", value: "nuwakot", cities: [{ label: "Bidur", value: "bidur" }, { label: "Belkotgadhi", value: "belkotgadhi" }] },
      { label: "Ramechhap", value: "ramechhap", cities: [{ label: "Manthali", value: "manthali" }, { label: "Ramechhap Municipality", value: "ramechhap municipality" }] },
      { label: "Rasuwa", value: "rasuwa", cities: [{ label: "Dhunche", value: "dhunche" }, { label: "Uttargaya", value: "uttargaya" }] },
      { label: "Sindhuli", value: "sindhuli", cities: [{ label: "Kamalamai", value: "kamalamai" }, { label: "Dudhouli", value: "dudhouli" }] },
      { label: "Sindhupalchok", value: "sindhupalchok", cities: [{ label: "Chautara Sangachokgadhi", value: "chautara sangachokgadhi" }, { label: "Melamchi", value: "melamchi" }, { label: "Barhabise", value: "barhabise" }] }
    ]
  },
  {
    label: "Gandaki",
    value: "gandaki",
    districts: [
      { label: "Baglung", value: "baglung", cities: [{ label: "Baglung", value: "baglung" }, { label: "Dhorpatan", value: "dhorpatan" }] },
      { label: "Gorkha", value: "gorkha", cities: [{ label: "Gorkha", value: "gorkha" }, { label: "Palungtar", value: "palungtar" }] },
      { label: "Kaski", value: "kaski", cities: [{ label: "Pokhara", value: "pokhara" }, { label: "Annapurna", value: "annapurna" }] },
      { label: "Lamjung", value: "lamjung", cities: [{ label: "Besisahar", value: "besisahar" }, { label: "MadhyaNepal", value: "madhyanepal" }] },
      { label: "Manang", value: "manang", cities: [{ label: "Chame", value: "chame" }, { label: "Ngisyang", value: "ngisyang" }] },
      { label: "Mustang", value: "mustang", cities: [{ label: "Jomsom", value: "jomsom" }, { label: "Gharapjhong", value: "gharapjhong" }] },
      { label: "Myagdi", value: "myagdi", cities: [{ label: "Beni", value: "beni" }, { label: "Annapurna", value: "annapurna" }] },
      { label: "Nawalpur", value: "nawalpur", cities: [{ label: "Kawasoti", value: "kawasoti" }, { label: "Gaindakot", value: "gaindakot" }, { label: "Devchuli", value: "devchuli" }] },
      { label: "Parbat", value: "parbat", cities: [{ label: "Kushma", value: "kushma" }, { label: "Phalebas", value: "phalebas" }] },
      { label: "Syangja", value: "syangja", cities: [{ label: "Putalibazar", value: "putalibazar" }, { label: "Waling", value: "waling" }] },
      { label: "Tanahun", value: "tanahun", cities: [{ label: "Byas", value: "byas" }, { label: "Shuklagandaki", value: "shuklagandaki" }, { label: "Bhanu", value: "bhanu" }] }
    ]
  },
  {
    label: "Lumbini",
    value: "lumbini",
    districts: [
      { label: "Arghakhanchi", value: "arghakhanchi", cities: [{ label: "Sandhikharka", value: "sandhikharka" }, { label: "Sitganga", value: "sitganga" }] },
      { label: "Banke", value: "banke", cities: [{ label: "Nepalgunj", value: "nepalgunj" }, { label: "Kohalpur", value: "kohalpur" }] },
      { label: "Bardiya", value: "bardiya", cities: [{ label: "Gulariya", value: "gulariya" }, { label: "Madhuwan", value: "madhuwan" }] },
      { label: "Dang", value: "dang", cities: [{ label: "Ghorahi", value: "ghorahi" }, { label: "Tulsipur", value: "tulsipur" }, { label: "Lamahi", value: "lamahi" }] },
      { label: "Eastern Rukum", value: "eastern rukum", cities: [{ label: "Rukumkot", value: "rukumkot" }, { label: "Bhume", value: "bhume" }] },
      { label: "Gulmi", value: "gulmi", cities: [{ label: "Tamghas", value: "tamghas" }, { label: "Resunga", value: "resunga" }] },
      { label: "Kapilvastu", value: "kapilvastu", cities: [{ label: "Taulihawa", value: "taulihawa" }, { label: "Kapilvastu", value: "kapilvastu" }, { label: "Banganga", value: "banganga" }] },
      { label: "Parasi", value: "parasi", cities: [{ label: "Ramgram", value: "ramgram" }, { label: "Sunwal", value: "sunwal" }] },
      { label: "Palpa", value: "palpa", cities: [{ label: "Tansen", value: "tansen" }, { label: "Rampur", value: "rampur" }] },
      { label: "Pyuthan", value: "pyuthan", cities: [{ label: "Pyuthan", value: "pyuthan" }, { label: "Swargadwari", value: "swargadwari" }] },
      { label: "Rolpa", value: "rolpa", cities: [{ label: "Liwang", value: "liwang" }, { label: "Rolpa Municipality", value: "rolpa municipality" }] },
      { label: "Rupandehi", value: "rupandehi", cities: [{ label: "Butwal", value: "butwal" }, { label: "Siddharthanagar", value: "siddharthanagar" }, { label: "Tilottama", value: "tilottama" }] }
    ]
  },
  {
    label: "Karnali",
    value: "karnali",
    districts: [
      { label: "Dailekh", value: "dailekh", cities: [{ label: "Narayan", value: "narayan" }, { label: "Dullu", value: "dullu" }] },
      { label: "Dolpa", value: "dolpa", cities: [{ label: "Dunai", value: "dunai" }, { label: "Thuli Bheri", value: "thuli bheri" }] },
      { label: "Humla", value: "humla", cities: [{ label: "Simikot", value: "simikot" }, { label: "Namkha", value: "namkha" }] },
      { label: "Jajarkot", value: "jajarkot", cities: [{ label: "Khalanga", value: "khalanga" }, { label: "Bheri", value: "bheri" }] },
      { label: "Jumla", value: "jumla", cities: [{ label: "Chandannath", value: "chandannath" }, { label: "Tatopani", value: "tatopani" }] },
      { label: "Kalikot", value: "kalikot", cities: [{ label: "Manma", value: "manma" }, { label: "Khandachakra", value: "khandachakra" }] },
      { label: "Mugu", value: "mugu", cities: [{ label: "Gamgadhi", value: "gamgadhi" }, { label: "Chhayanath Rara", value: "chhayanath rara" }] },
      { label: "Salyan", value: "salyan", cities: [{ label: "Sharada", value: "sharada" }, { label: "Bagchaur", value: "bagchaur" }] },
      { label: "Surkhet", value: "surkhet", cities: [{ label: "Birendranagar", value: "birendranagar" }, { label: "Bheriganga", value: "bheriganga" }] },
      { label: "Western Rukum", value: "western rukum", cities: [{ label: "Musikot", value: "musikot" }, { label: "Aathbiskot", value: "aathbiskot" }] }
    ]
  },
  {
    label: "Sudurpashchim",
    value: "sudurpashchim",
    districts: [
      { label: "Achham", value: "achham", cities: [{ label: "Mangalsen", value: "mangalsen" }, { label: "Sanfebagar", value: "sanfebagar" }] },
      { label: "Baitadi", value: "baitadi", cities: [{ label: "Dasharathchand", value: "dasharathchand" }, { label: "Patan", value: "patan" }] },
      { label: "Bajhang", value: "bajhang", cities: [{ label: "Jaya Prithvi", value: "jaya prithvi" }, { label: "Bungal", value: "bungal" }] },
      { label: "Bajura", value: "bajura", cities: [{ label: "Martadi", value: "martadi" }, { label: "Badimalika", value: "badimalika" }] },
      { label: "Dadeldhura", value: "dadeldhura", cities: [{ label: "Amargadhi", value: "amargadhi" }, { label: "Parashuram", value: "parashuram" }] },
      { label: "Darchula", value: "darchula", cities: [{ label: "Darchula", value: "darchula" }, { label: "Mahakali", value: "mahakali" }] },
      { label: "Doti", value: "doti", cities: [{ label: "Dipayal Silgadhi", value: "dipayal silgadhi" }, { label: "Shikhar", value: "shikhar" }] },
      { label: "Kailali", value: "kailali", cities: [{ label: "Dhangadhi", value: "dhangadhi" }, { label: "Tikapur", value: "tikapur" }, { label: "Lamkichuha", value: "lamkichuha" }] },
      { label: "Kanchanpur", value: "kanchanpur", cities: [{ label: "Bhimdatta", value: "bhimdatta" }, { label: "Mahendranagar", value: "mahendranagar" }, { label: "Krishnapur", value: "krishnapur" }] }
    ]
  }
];
