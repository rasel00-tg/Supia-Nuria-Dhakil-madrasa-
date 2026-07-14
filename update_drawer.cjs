const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

// Update Drawer entry animation
code = code.replace(
  /initial=\{\{ x: "100%" \}\}\s*animate=\{\{ x: 0 \}\}\s*exit=\{\{ x: "100%" \}\}\s*transition=\{\{ type: "spring", damping: 25, stiffness: 200 \}\}\s*className="fixed right-0 top-0 bottom-0 w-80 max-w-\[85vw\] bg-emerald-950 text-white shadow-2xl z-50 flex flex-col justify-between border-l-4 border-amber-500"/g,
  `initial={{ x: "100%", opacity: 0 }}\n              animate={{ x: 0, opacity: 1 }}\n              exit={{ x: "100%", opacity: 0 }}\n              transition={{ type: "spring", damping: 22, stiffness: 250, mass: 0.8 }}\n              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-emerald-950 text-white shadow-[0_0_30px_rgba(0,0,0,0.3)] z-50 flex flex-col justify-between border-l-[3px] border-amber-500/80 backdrop-blur-md"`
);

// Update submenu toggle expansion animation
code = code.replace(
  /initial=\{\{ height: 0, opacity: 0 \}\}\s*animate=\{\{ height: "auto", opacity: 1 \}\}\s*exit=\{\{ height: 0, opacity: 0 \}\}\s*transition=\{\{ duration: 0.2 \}\}/g,
  `initial={{ height: 0, opacity: 0, y: -5, scale: 0.98 }}\n                            animate={{ height: "auto", opacity: 1, y: 0, scale: 1 }}\n                            exit={{ height: 0, opacity: 0, y: -5, scale: 0.98 }}\n                            transition={{ type: "spring", damping: 20, stiffness: 220 }}`
);

// Add scrollbar styling to the drawer content area
code = code.replace(
  /className="flex-1 overflow-y-auto py-6 px-4 space-y-2"/g,
  `className="flex-1 overflow-y-auto py-6 px-4 space-y-2.5 hide-scrollbar overscroll-y-contain"`
);

// Update root level menu item active/hover styling
code = code.replace(
  /className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 text-emerald-100 hover:bg-emerald-800\/50 hover:text-white"/g,
  `className="group flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-300 text-emerald-100 hover:bg-emerald-800/80 hover:text-white hover:shadow-[0_0_12px_rgba(52,211,153,0.25)]"`
);

// Update dropdown trigger active/hover styling
code = code.replace(
  /className=\{`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 \$\{\s*isExpanded\s*\?\s*"bg-emerald-800 text-white"\s*:\s*"text-emerald-100 hover:bg-emerald-800\/50 hover:text-white"\s*\}`\}/g,
  `className={\`group flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-300 \${isExpanded ? "bg-emerald-800/90 text-white shadow-[0_0_15px_rgba(52,211,153,0.15)]" : "text-emerald-100 hover:bg-emerald-800/80 hover:text-white hover:shadow-[0_0_12px_rgba(52,211,153,0.25)]"}\`}`
);

// Add group-hover coloring to Icons
code = code.replace(
  /<Icon className="h-5 w-5 shrink-0" \/>/g,
  `<Icon className="h-5 w-5 shrink-0 group-hover:text-amber-400 transition-colors duration-300" />`
);

// Update submenu items active/hover styling
code = code.replace(
  /className="w-full text-left py-2 px-3 rounded-lg text-sm text-emerald-200 hover:bg-emerald-800\/50 hover:text-white transition-colors"/g,
  `className="w-full text-left py-2 px-3 rounded-lg text-sm text-emerald-200 hover:bg-emerald-800 hover:text-amber-300 transition-all duration-300 hover:pl-4"`
);

// Update submenu container
code = code.replace(
  /className="pl-12 pr-4 py-2 space-y-1 bg-emerald-900\/30 rounded-xl mt-1 border-l-2 border-emerald-800 ml-4"/g,
  `className="pl-11 pr-4 py-2 space-y-1 bg-emerald-900/40 rounded-xl mt-2 border-l border-emerald-700/50 shadow-inner ml-6"`
);

fs.writeFileSync('src/components/Navbar.tsx', code);
