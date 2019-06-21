import Signed, { TSignedConfig, defaultSignedConfig } from './Signed';
import Digit, { TConfig, defaultConfig } from './Digit';

type prefixPosition = 'before-signed' | 'after-signed';

export interface IConverterConfig
  extends Pick<TConfig, Exclude<keyof TConfig, 'placeUnit'>>,
    TSignedConfig {
  readonly prefix: string;
  readonly suffix: string;
  readonly prefixPosition: prefixPosition;
}

const defaultConverterConfig: IConverterConfig = {
  ...defaultConfig,
  ...defaultSignedConfig,
  prefix: '',
  suffix: '',
  prefixPosition: 'after-signed'
};

function objectize(numbers: string[], config: RecursivePartial<IConverterConfig> = {}): Digit[] {
  const digits: Digit[] = [];
  numbers.forEach((n, i) => {
    const digit = new Digit(n, { ...config, placeUnit: i });
    if (digits.length > 0) {
      digit.setPrev(digits[i - 1]);
      digits[i - 1].setNext(digit);
    }
    digits.push(digit);
  });
  return digits;
}

function isValidNumberText(nText: string): boolean {
  return /^[+-]?(?:\d[\d,，]+\d|\d+)/.test(nText);
}

export default function main(
  text: string | number | bigint,
  userConfig: RecursivePartial<IConverterConfig> = defaultConverterConfig
): string {
  if (typeof text === 'number' || typeof text === 'bigint') {
    return main(text.toString(), userConfig);
  }

  const toNormal = (<string>text).normalize('NFKC');
  const config = { ...defaultConverterConfig, ...(userConfig || {}) };

  if (!isValidNumberText(toNormal)) {
    throw new Error('invalid number or number has exponent symbol after it has been converted. ');
  }

  const hasSigned = Signed.hasSigned(toNormal);

  let signed: string = '';
  if (hasSigned) {
    signed = new Signed(toNormal.charAt(0), config).toString();
  }

  const numberText = hasSigned ? toNormal.slice(1) : toNormal;
  const numberToChars = numberText
    .replace(/[,，]/g, '')
    .split('')
    .reverse();

  const numberToDigits = objectize(numberToChars, config);
  const number = numberToDigits.reduce((p, c) => c.toString() + p, '');

  const prefix = (config.prefix !== void 0 && config.prefix) || '';
  const suffix = (config.suffix !== void 0 && config.suffix) || '';

  let head = '';
  if (config.prefixPosition === 'after-signed') {
    head += signed + prefix;
  } else if (config.prefixPosition === 'before-signed') {
    head += prefix + signed;
  }

  return head + number + suffix;
}
