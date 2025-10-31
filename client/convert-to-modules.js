const fs = require('fs');
const path = require('path');

// Function to convert className="something" to className={styles.something} or className={styles['something-with-dash']}
function convertClassNames(content, stylesVarName = 'styles') {
  // Match className="..." or className='...'
  return content.replace(/className=["']([^"']+)["']/g, (match, classNames) => {
    const classes = classNames.trim().split(/\s+/);
    
    if (classes.length === 1) {
      const className = classes[0];
      // If class has dash, use bracket notation
      if (className.includes('-')) {
        return `className={${stylesVarName}['${className}']}`;
      }
      return `className={${stylesVarName}.${className}}`;
    } else {
      // Multiple classes
      const classExpressions = classes.map(className => {
        if (className.includes('-')) {
          return `${stylesVarName}['${className}']`;
        }
        return `${stylesVarName}.${className}`;
      });
      return `className={\`\${${classExpressions.join('} \${')}\}\`}`;
    }
  });
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.log('Usage: node convert-to-modules.js <file-path>');
  process.exit(1);
}

// Read file
const content = fs.readFileSync(filePath, 'utf8');

// Convert classNames
const converted = convertClassNames(content);

// Write back
fs.writeFileSync(filePath, converted, 'utf8');

console.log(`✅ Converted ${filePath}`);
