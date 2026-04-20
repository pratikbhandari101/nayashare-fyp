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
];

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
];

export const NEPAL_LOCATION_TREE = [
  {
    province: "Koshi",
    districts: [
      { district: "Bhojpur", cities: ["Bhojpur Municipality", "Shadananda"] },
      { district: "Dhankuta", cities: ["Dhankuta Municipality", "Pakhribas"] },
      { district: "Ilam", cities: ["Ilam Municipality", "Deumai", "Suryodaya"] },
      { district: "Jhapa", cities: ["Bhadrapur", "Damak", "Mechinagar", "Birtamod"] },
      { district: "Khotang", cities: ["Diktel Rupakot Majhuwagadhi", "Halesi Tuwachung"] },
      { district: "Morang", cities: ["Biratnagar", "Belbari", "Sundarharaicha", "Urlabari"] },
      { district: "Okhaldhunga", cities: ["Siddhicharan", "Molung"] },
      { district: "Panchthar", cities: ["Phidim", "Falelung"] },
      { district: "Sankhuwasabha", cities: ["Khandbari", "Chainpur"] },
      { district: "Solukhumbu", cities: ["Solu Dudhkunda", "Khumbu Pasanglhamu"] },
      { district: "Sunsari", cities: ["Inaruwa", "Itahari", "Dharan", "Duhabi"] },
      { district: "Taplejung", cities: ["Phungling", "Meringden"] },
      { district: "Terhathum", cities: ["Myanglung", "Aathrai"] },
      { district: "Udayapur", cities: ["Triyuga", "Katari", "Chaudandigadhi"] }
    ]
  },
  {
    province: "Madhesh",
    districts: [
      { district: "Bara", cities: ["Kalaiya", "Simraungadh", "Jitpur Simara"] },
      { district: "Dhanusha", cities: ["Janakpurdham", "Mithila", "Ganeshman Charnath"] },
      { district: "Mahottari", cities: ["Jaleshwar", "Bardibas", "Gaushala"] },
      { district: "Parsa", cities: ["Birgunj", "Pokhariya", "Bahudarmai"] },
      { district: "Rautahat", cities: ["Gaur", "Chandrapur", "Garuda"] },
      { district: "Saptari", cities: ["Rajbiraj", "Kanchanrup", "Shambhunath"] },
      { district: "Sarlahi", cities: ["Malangwa", "Hariwan", "Lalbandi"] },
      { district: "Siraha", cities: ["Siraha", "Lahan", "Dhangadhimai"] }
    ]
  },
  {
    province: "Bagmati",
    districts: [
      { district: "Bhaktapur", cities: ["Bhaktapur", "Madhyapur Thimi", "Suryabinayak"] },
      { district: "Chitwan", cities: ["Bharatpur", "Ratnanagar", "Khairahani"] },
      { district: "Dhading", cities: ["Nilkantha", "Khaniyabas"] },
      { district: "Dolakha", cities: ["Bhimeshwar", "Jiri"] },
      { district: "Kathmandu", cities: ["Kathmandu", "Kirtipur", "Tokha", "Budhanilkantha"] },
      { district: "Kavrepalanchok", cities: ["Dhulikhel", "Banepa", "Panauti"] },
      { district: "Lalitpur", cities: ["Lalitpur", "Godawari", "Mahalaxmi"] },
      { district: "Makwanpur", cities: ["Hetauda", "Thaha"] },
      { district: "Nuwakot", cities: ["Bidur", "Belkotgadhi"] },
      { district: "Ramechhap", cities: ["Manthali", "Ramechhap Municipality"] },
      { district: "Rasuwa", cities: ["Dhunche", "Uttargaya"] },
      { district: "Sindhuli", cities: ["Kamalamai", "Dudhouli"] },
      { district: "Sindhupalchok", cities: ["Chautara Sangachokgadhi", "Melamchi", "Barhabise"] }
    ]
  },
  {
    province: "Gandaki",
    districts: [
      { district: "Baglung", cities: ["Baglung", "Dhorpatan"] },
      { district: "Gorkha", cities: ["Gorkha", "Palungtar"] },
      { district: "Kaski", cities: ["Pokhara", "Annapurna"] },
      { district: "Lamjung", cities: ["Besisahar", "MadhyaNepal"] },
      { district: "Manang", cities: ["Chame", "Ngisyang"] },
      { district: "Mustang", cities: ["Jomsom", "Gharapjhong"] },
      { district: "Myagdi", cities: ["Beni", "Annapurna"] },
      { district: "Nawalpur", cities: ["Kawasoti", "Gaindakot", "Devchuli"] },
      { district: "Parbat", cities: ["Kushma", "Phalebas"] },
      { district: "Syangja", cities: ["Putalibazar", "Waling"] },
      { district: "Tanahun", cities: ["Byas", "Shuklagandaki", "Bhanu"] }
    ]
  },
  {
    province: "Lumbini",
    districts: [
      { district: "Arghakhanchi", cities: ["Sandhikharka", "Sitganga"] },
      { district: "Banke", cities: ["Nepalgunj", "Kohalpur"] },
      { district: "Bardiya", cities: ["Gulariya", "Madhuwan"] },
      { district: "Dang", cities: ["Ghorahi", "Tulsipur", "Lamahi"] },
      { district: "Eastern Rukum", cities: ["Rukumkot", "Bhume"] },
      { district: "Gulmi", cities: ["Tamghas", "Resunga"] },
      { district: "Kapilvastu", cities: ["Taulihawa", "Kapilvastu", "Banganga"] },
      { district: "Parasi", cities: ["Ramgram", "Sunwal"] },
      { district: "Palpa", cities: ["Tansen", "Rampur"] },
      { district: "Pyuthan", cities: ["Pyuthan", "Swargadwari"] },
      { district: "Rolpa", cities: ["Liwang", "Rolpa Municipality"] },
      { district: "Rupandehi", cities: ["Butwal", "Siddharthanagar", "Tilottama"] }
    ]
  },
  {
    province: "Karnali",
    districts: [
      { district: "Dailekh", cities: ["Narayan", "Dullu"] },
      { district: "Dolpa", cities: ["Dunai", "Thuli Bheri"] },
      { district: "Humla", cities: ["Simikot", "Namkha"] },
      { district: "Jajarkot", cities: ["Khalanga", "Bheri"] },
      { district: "Jumla", cities: ["Chandannath", "Tatopani"] },
      { district: "Kalikot", cities: ["Manma", "Khandachakra"] },
      { district: "Mugu", cities: ["Gamgadhi", "Chhayanath Rara"] },
      { district: "Salyan", cities: ["Sharada", "Bagchaur"] },
      { district: "Surkhet", cities: ["Birendranagar", "Bheriganga"] },
      { district: "Western Rukum", cities: ["Musikot", "Aathbiskot"] }
    ]
  },
  {
    province: "Sudurpashchim",
    districts: [
      { district: "Achham", cities: ["Mangalsen", "Sanfebagar"] },
      { district: "Baitadi", cities: ["Dasharathchand", "Patan"] },
      { district: "Bajhang", cities: ["Jaya Prithvi", "Bungal"] },
      { district: "Bajura", cities: ["Martadi", "Badimalika"] },
      { district: "Dadeldhura", cities: ["Amargadhi", "Parashuram"] },
      { district: "Darchula", cities: ["Darchula", "Mahakali"] },
      { district: "Doti", cities: ["Dipayal Silgadhi", "Shikhar"] },
      { district: "Kailali", cities: ["Dhangadhi", "Tikapur", "Lamkichuha"] },
      { district: "Kanchanpur", cities: ["Bhimdatta", "Mahendranagar", "Krishnapur"] }
    ]
  }
];
