// =====================================================
// SUPABASE AYARLARI - Buraya kendi bilgilerinizi girin
// =====================================================
const SUPABASE_URL = "https://xirfcajiiiodxtqutqpw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcmZjYWppaWlvZHh0cXV0cXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NjczNzMsImV4cCI6MjA5ODA0MzM3M30.b8REc4EvrrV_2xReAF1WcnKlO3WOYpvC9Vd4vRDSJDU";

// Invekto API
const INVEKTO_API = "https://app.invekto.com/invekto/pbxreport";

// Şirket kodları
const COMPANIES = [
  { label: "Birim 1", code: "59048767" },
  { label: "Birim 2", code: "89571052" }
];

// Departmanlar
const DEPTS = ["Dış Data","Karşılama","Dönüşüm","Yatırımlı Pasif","Retention"];

// Departman kuralları
const RULES = {
  "Dış Data":        {ilk:"10:15",ogleOnce:"13:50",ogleSonrasi:"15:15",gunSonu:"18:50",aralik:20},
  "Karşılama":       {ilk:"11:15",ogleOnce:"13:45",ogleSonrasi:"15:15",gunSonu:"18:45",aralik:30},
  "Dönüşüm":         {ilk:"10:30",ogleOnce:"13:50",ogleSonrasi:"15:15",gunSonu:"18:50",aralik:30},
  "Yatırımlı Pasif": {ilk:"10:30",ogleOnce:"13:50",ogleSonrasi:"15:20",gunSonu:"19:00",aralik:20},
  "Retention":       null
};
