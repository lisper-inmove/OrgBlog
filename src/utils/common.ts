import { Constants } from './constants';

export function encodeBase64(input: string): string {
  const encoded = Buffer.from(input).toString('base64');
  return encoded.replace(/=+$/, '');
}

export function decodeBase64(encoded: string): string {
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  return decoded;
}

export function extractSubstring(pattern: string, str: string): string | null {
  const regex = new RegExp(`${pattern}.*$`);
  const result = str.match(regex);
  return result ? result[0].slice(pattern.length) : null;
}

// TODO: CSS的参数从 Constants中读
export function getTextStyle(styleName: string) {
  let style = {};
  switch (styleName) {
    case 'bold':
      style = { 
        fontWeight: 'bold',
        color: '#ffa3a3'
      };
      break;
    case 'verbatim':
      style = { 
        fontFamily: Constants.inlineCodeFontFamily,
        color: Constants.inlineCodeTextColor,
        // backgroundColor: Constants.inlineCodeBgColor,
        fontSize: Constants.inlineCodeFontSize,
        padding: Constants.inlineCodePadding,
        borderRadius: Constants.inlineCodeBgColor,
      };
      break;
    case 'underline':
      style = { textDecoration: 'underline' };
      break;
    case 'italic':
      style = { fontStyle: 'italic' };
      break;
    default:
      break;
  }
  return style;
}
