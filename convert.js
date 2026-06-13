const fs = require('fs');

function convertSvgToComponent(svgPath, componentName, width, height) {
    const destPath = `./frontend/src/components/${componentName}.js`;
    
    let content = fs.readFileSync(svgPath, 'utf8');
    
    // Extract paths and defs, replacing fill="#F75008" with fill={color}
    content = content.replace(/fill="#F75008"/gi, 'fill={color}');
    content = content.replace(/fill-rule/g, 'fillRule');
    content = content.replace(/clip-rule/g, 'clipRule');
    content = content.replace(/clip-path/g, 'clipPath');
    
    // Extract inner content inside <svg> tags
    const innerContentMatch = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    if (!innerContentMatch) return;
    let innerContent = innerContentMatch[1];
    
    // Make tags capitalized for react-native-svg
    innerContent = innerContent.replace(/<path /g, '<Path ')
                               .replace(/<\/path>/g, '</Path>')
                               .replace(/<g /g, '<G ')
                               .replace(/<\/g>/g, '</G>')
                               .replace(/<defs>/g, '<Defs>')
                               .replace(/<\/defs>/g, '</Defs>')
                               .replace(/<clipPath /g, '<ClipPath ')
                               .replace(/<\/clipPath>/g, '</ClipPath>')
                               .replace(/<rect /g, '<Rect ')
                               .replace(/<\/rect>/g, '</Rect>');

    const componentCode = `import React from 'react';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

const ${componentName} = ({ size = 28, color = "#F95003", ...props }) => {
  return (
    <Svg width={size} height={size * (${height}/${width})} viewBox="0 0 ${width} ${height}" fill="none" stroke={color} strokeWidth="0.5" {...props}>
      ${innerContent}
    </Svg>
  );
};

export default ${componentName};
`;
    fs.writeFileSync(destPath, componentCode);
}

convertSvgToComponent('/Users/ayushsaxena/Desktop/Animal.svg', 'AnimalIcon', 198, 184);
convertSvgToComponent('/Users/ayushsaxena/Desktop/Mating.svg', 'MatingIcon', 30, 41);
