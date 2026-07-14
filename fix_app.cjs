const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const brokenRegex = /\{activeTab === "teachers" \{activeTab === "teachers" && <TeachersSection \/>\}\{activeTab === "teachers" && <TeachersSection \/>\} <TeachersSection \/>\}/g;
code = code.replace(brokenRegex, '{activeTab === "teachers" && <TeachersSection />}');

const brokenRegex2 = /\{activeTab === "overview" \{activeTab === "teachers" && <TeachersSection \/>\}\{activeTab === "teachers" && <TeachersSection \/>\} <InstituteOverviewSection \/>\}/g;
code = code.replace(brokenRegex2, '{activeTab === "overview" && <InstituteOverviewSection />}');

fs.writeFileSync('src/App.tsx', code);
