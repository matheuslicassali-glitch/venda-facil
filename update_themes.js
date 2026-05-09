const fs = require('fs');
const path = require('path');

const targetFiles = [
  'pages/Dashboard.tsx', 'pages/Products.tsx', 'pages/POS.tsx', 
  'pages/Inventory.tsx', 'pages/Clients.tsx', 'pages/Finance.tsx', 
  'pages/Invoices.tsx', 'pages/Suppliers.tsx', 'pages/Employees.tsx',
  'pages/Reports.tsx', 'pages/Cashier.tsx', 'pages/CommonSales.tsx',
  'pages/Settings.tsx', 'pages/NFeManual.tsx', 'components/Sidebar.tsx',
  'components/Header.tsx', 'pages/Login.tsx', 'components/ui/Modal.tsx',
  'components/ui/Button.tsx', 'components/ui/Input.tsx'
];

targetFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Theme replacements mapping
  const replacements = [
    { regex: /\bbg-white\b/g, replacement: 'bg-card text-card-foreground' },
    { regex: /\bbg-slate-50\b/g, replacement: 'bg-background text-foreground' },
    { regex: /\bbg-gray-50\b/g, replacement: 'bg-muted text-muted-foreground' },
    { regex: /\bbg-slate-100\b/g, replacement: 'bg-muted text-muted-foreground' },
    { regex: /\bborder-gray-100\b/g, replacement: 'border-border' },
    { regex: /\bborder-slate-100\b/g, replacement: 'border-border' },
    { regex: /\bborder-gray-200\b/g, replacement: 'border-border' },
    { regex: /\bborder-slate-200\b/g, replacement: 'border-border' },
    { regex: /\btext-slate-800\b/g, replacement: 'text-foreground' },
    { regex: /\btext-gray-800\b/g, replacement: 'text-foreground' },
    { regex: /\btext-slate-900\b/g, replacement: 'text-foreground' },
    { regex: /\btext-gray-900\b/g, replacement: 'text-foreground' },
    { regex: /\btext-slate-500\b/g, replacement: 'text-muted-foreground' },
    { regex: /\btext-gray-500\b/g, replacement: 'text-muted-foreground' },
    { regex: /\btext-slate-400\b/g, replacement: 'text-muted-foreground' },
    { regex: /\btext-gray-400\b/g, replacement: 'text-muted-foreground' },
    { regex: /\bbg-blue-600\b/g, replacement: 'bg-primary text-primary-foreground' },
    { regex: /\bbg-blue-500\b/g, replacement: 'bg-primary text-primary-foreground' },
    { regex: /\btext-blue-600\b/g, replacement: 'text-primary' },
    { regex: /\btext-blue-500\b/g, replacement: 'text-primary' },
    { regex: /\bring-blue-500\b/g, replacement: 'ring-ring' },
    { regex: /\bring-blue-600\b/g, replacement: 'ring-ring' },
  ];

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  // Clean up double text-colors that might happen due to naive replacement
  content = content.replace(/text-card-foreground text-foreground/g, 'text-card-foreground');
  content = content.replace(/text-foreground text-card-foreground/g, 'text-card-foreground');
  content = content.replace(/text-muted-foreground text-muted-foreground/g, 'text-muted-foreground');
  content = content.replace(/text-primary-foreground text-white/g, 'text-primary-foreground');
  content = content.replace(/text-white text-primary-foreground/g, 'text-primary-foreground');

  fs.writeFileSync(fullPath, content);
});

console.log('Systematic update of theme variables completed.');
