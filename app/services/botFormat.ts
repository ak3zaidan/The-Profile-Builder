import type Profile from "../types/profile";

// Simple UUID generator function
const uuidv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Map of country codes to full names
const countryCodeToName: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'CH': 'Switzerland',
  'AT': 'Austria',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'IE': 'Ireland',
  'NZ': 'New Zealand',
  'JP': 'Japan',
  'CN': 'China',
  'IN': 'India',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'VE': 'Venezuela',
  'ZA': 'South Africa',
  'RU': 'Russia',
  'TR': 'Turkey',
  'IL': 'Israel',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'SG': 'Singapore',
  'MY': 'Malaysia',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'PH': 'Philippines',
  'ID': 'Indonesia'
};

// Function to get full country name from code
const getCountryName = (code: string): string => {
  return countryCodeToName[code] || code;
};

// Map of US states to their 2-letter abbreviations
const stateToAbbr: Record<string, string> = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
  "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
  "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
  "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
  "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
  "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
  "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
  "district of columbia": "DC"
};

// Function to convert state name to abbreviation
const getStateAbbr = (state: string): string => {
  if (state.length === 2 && state === state.toUpperCase()) {
    return state; // Already an abbreviation
  }

  const abbr = stateToAbbr[state.toLowerCase()];
  return abbr || state;
};

// Function to generate a random alphanumeric ID of specific length
const generateAlphaNumericId = (length: number, uppercase: boolean = true): string => {
  const chars = uppercase ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Function to detect card type from card number
const detectCardType = (cardNumber: string): string => {
  const num = cardNumber.replace(/\D/g, '');

  if (/^4/.test(num)) return "visa";
  if (/^5[1-5]/.test(num)) return "mastercard";
  if (/^3[47]/.test(num)) return "amex";
  if (/^6(?:011|5|4[4-9])/.test(num)) return "discover";

  return "unknown";
};

export type BotFormat<T> = {
  /** Friendly label for UI */
  label: string;
  /** Which file type to generate */
  fileType: "csv" | "json" | "hayha";
  /** CSV headers in order (only for CSV) */
  headers?: string[];
  /** Map a single Profile → whatever payload that bot expects */
  transform: (g: string, p: Profile, index?: number) => T;
  /** Output filename */
  filename: string;
};

/**
 * Adapters for each bot's required format.
 */
export const botFormats: Record<string, BotFormat<any>> = {
  /* Make Format */
  "Make Format": {
    label: "Make Format (CSV)",
    fileType: "csv",
    headers: [
      "profileName", "firstName", "lastName", "email",
      "address1", "address2", "city", "state", "zipcode", "country",
      "phoneNumber", "ccNumber", "ccMonth", "ccYear", "cvv"
    ],
    transform: (g, p, index = 0) => {
      return [
        // Replace with your profile naming logic
        `${g}_${index + 1}`,
        p.firstName,
        p.lastName,
        p.email,
        p.shippingAddress.address1,
        p.shippingAddress.address2 || "",
        p.shippingAddress.city,
        getStateAbbr(p.shippingAddress.state),
        p.shippingAddress.zipCode,
        p.shippingAddress.country,
        p.phone.replace(/\D/g, ''),
        p.card.number,
        p.card.exp.split("/")[0],
        p.card.exp.split("/")[1],
        p.card.cvv,
      ]
    },
    filename: "make_profiles.csv",
  },

  /* Valor Format */
  "Valor Format": {
    label: "Valor Format (JSON)",
    fileType: "json",
    transform: (g, p, index = 0) => {
      const uuid = uuidv4();
      return {
        [uuid]: {
          name: `${g}_${index + 1}`,
          email: p.email,
          phoneNumber: p.phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'),
          billingSameAsShipping: false,
          oneCheckout: false,
          quickTask: false,
          card: {
            holder: p.card.holderName,
            number: p.card.number,
            expiration: p.card.exp,
            cvv: p.card.cvv,
            type: detectCardType(p.card.number),
          },
          shipping: {
            firstName: p.shippingAddress.firstName,
            lastName: p.shippingAddress.lastName,
            addressLine1: p.shippingAddress.address1,
            addressLine2: p.shippingAddress.address2 || "",
            city: p.shippingAddress.city,
            countryName: getCountryName(p.shippingAddress.country),
            countryCode: p.shippingAddress.country,
            state: p.shippingAddress.state,
            zipCode: p.shippingAddress.zipCode,
          },
          billing: {
            firstName: p.billingAddress.firstName,
            lastName: p.billingAddress.lastName,
            addressLine1: p.shippingAddress.address1,
            addressLine2: p.shippingAddress.address2 || "",
            city: p.shippingAddress.city,
            countryName: getCountryName(p.shippingAddress.country),
            countryCode: p.shippingAddress.country,
            state: p.shippingAddress.state,
            zipCode: p.shippingAddress.zipCode,
          },
          id: uuid,
          totalSpent: 0,
        }
      };
    },
    filename: "valor_profiles.json",
  },

  /* Stellar Format */
  "Stellar Format": {
    label: "Stellar Format (JSON)",
    fileType: "json",
    transform: (g, p, index = 0) => ({
      profileName: `${g}_${index + 1}`,
      email: p.email,
      phone: p.phone.replace(/\D/g, ''),
      shipping: {
        firstName: p.shippingAddress.firstName,
        lastName: p.shippingAddress.lastName,
        country: p.shippingAddress.country,
        address: p.shippingAddress.address1,
        address2: p.shippingAddress.address2 || "",
        state: getStateAbbr(p.shippingAddress.state),
        city: p.shippingAddress.city,
        zipcode: p.shippingAddress.zipCode,
      },
      billingAsShipping: false,
      billing: {
        firstName: p.billingAddress.firstName,
        lastName: p.billingAddress.lastName,
        country: p.billingAddress.country,
        address: p.billingAddress.address1,
        address2: p.billingAddress.address2 || "",
        state: getStateAbbr(p.billingAddress.state),
        city: p.billingAddress.city,
        zipcode: p.billingAddress.zipCode,
      },
      payment: {
        cardName: p.firstName + " " + p.lastName,
        cardType: (() => {
          const cardType = detectCardType(p.card.number);
          const cardTypeMap: Record<string, string> = {
            'visa': 'Visa',
            'mastercard': 'MasterCard',
            'amex': 'Amex',
            'discover': 'Discover',
            'unknown': 'Visa'
          };
          return cardTypeMap[cardType] || 'Visa';
        })(),
        cardNumber: p.card.number,
        cardMonth: p.card.exp.split("/")[0],
        cardYear: p.card.exp.split("/")[1],
        cardCvv: p.card.cvv,
      }
    }),
    filename: "stellar_profiles.json",
  },

  /* Hayha Format (.Hayha) */
  "Hayha Format": {
    label: "Hayha Format (.Hayha)",
    fileType: "hayha",
    transform: (g, p, index = 0) => {
      const stateAbbr = getStateAbbr(p.shippingAddress.state);
      const billingStateAbbr = getStateAbbr(p.billingAddress.state);
      const groupUuid = uuidv4();
      const idUuid = uuidv4();

      return {
        name: `${g}_${index + 1}`,
        shipping: {
          firstName: p.shippingAddress.firstName,
          lastName: p.shippingAddress.lastName,
          email: p.email,
          phone: p.phone.replace(/\D/g, ''),
          address: p.shippingAddress.address1,
          address2: p.shippingAddress.address2 || "",
          country: getCountryName(p.billingAddress.country),
          state: { shortCode: stateAbbr, name: p.shippingAddress.state },
          city: p.shippingAddress.city,
          zipCode: p.shippingAddress.zipCode,
        },
        cardInfo: {
          cardNumber: p.card.number,
          holder: p.card.holderName,
          expMonth: p.card.exp.split("/")[0],
          expYear: Number(`20${p.card.exp.split("/")[1]}`),
          cvv: p.card.cvv,
        },
        oneCheckout: false,
        sameAsBilling: false,
        billing: {
          firstName: p.billingAddress.firstName,
          lastName: p.billingAddress.lastName,
          email: p.email,
          phone: p.phone.replace(/\D/g, ''),
          address: p.billingAddress.address1,
          address2: p.billingAddress.address2 || "",
          country: getCountryName(p.billingAddress.country),
          state: { shortCode: billingStateAbbr, name: p.billingAddress.state },
          city: p.billingAddress.city,
          zipCode: p.billingAddress.zipCode,
        },
        groupId: groupUuid,
        id: idUuid,
      }
    },
    filename: "hahya_profiles.Hayha",
  },

  /* Refract Format */
  "Refract Format": {
    label: "Refract Format (JSON)",
    fileType: "json",
    transform: (g, p, index = 0) => {
      const uuid = uuidv4();
      const prfId = `prf-${uuid}`;

      return {
        name: `${g}_${index + 1}`,
        email: p.email,
        oneTimeUse: false,
        shipping: {
          firstName: p.shippingAddress.firstName,
          lastName: p.shippingAddress.lastName,
          address1: p.shippingAddress.address1,
          address2: p.shippingAddress.address2 || "",
          city: p.shippingAddress.city,
          province: p.shippingAddress.state,
          postalCode: p.shippingAddress.zipCode,
          country: p.shippingAddress.countryName,
          phone: p.phone.replace(/\D/g, ''),
        },
        billing: {
          sameAsShipping: false,
          firstName: p.billingAddress.firstName,
          lastName: p.billingAddress.lastName,
          address1: p.billingAddress.address1,
          address2: p.billingAddress.address2 || "",
          city: p.billingAddress.city,
          province: p.billingAddress.state,
          postalCode: p.billingAddress.zipCode,
          country: p.billingAddress.countryName,
          phone: p.phone.replace(/\D/g, ''),
        },
        payment: {
          name: p.card.holderName,
          num: p.card.number,
          year: `20${p.card.exp.split("/")[1]}`,
          month: p.card.exp.split("/")[0],
          cvv: p.card.cvv,
        },
        id: prfId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    },
    filename: "refract_profiles.json",
  },

  /* NSB Format */
  "NSB Format": {
    label: "NSB Format (JSON)",
    fileType: "json",
    transform: (g, p) => ({
      shipping: {
        firstname: p.shippingAddress.firstName,
        lastname: p.shippingAddress.lastName,
        country: p.shippingAddress.country,
        city: p.shippingAddress.city,
        address: p.shippingAddress.address1,
        address2: p.shippingAddress.address2 || "",
        state: getStateAbbr(p.shippingAddress.state),
        zip: p.shippingAddress.zipCode,
        phone: p.phone.replace(/\D/g, ''),
      },
      billing: {
        firstname: p.billingAddress.firstName,
        lastname: p.billingAddress.lastName,
        country: p.billingAddress.country,
        city: p.billingAddress.city,
        address: p.billingAddress.address1,
        address2: p.billingAddress.address2 || "",
        state: getStateAbbr(p.billingAddress.state),
        zip: p.billingAddress.zipCode,
        phone: p.phone.replace(/\D/g, ''),
      },
      name: p.firstName + " " + p.lastName,
      cc: {
        number: p.card.number,
        expiry: `${p.card.exp.split("/")[0]} / 20${p.card.exp.split("/")[1]}`,
        cvc: p.card.cvv,
        name: p.card.holderName,
      },
      email: p.email,
      checkoutLimit: "0",
      billingSame: false,
      date: Date.now(),
    }),
    filename: "nsb_profiles.json",
  },

  /* ShitBot Format (CSV) */
  "ShitBot Format": {
    label: "ShitBot Format (CSV)",
    fileType: "csv",
    headers: [
      "profile_name", "shipping_first_name", "shipping_middle_name", "shipping_last_name",
      "shipping_japanese_first_name", "shipping_japanese_last_name", "shipping_address",
      "shipping_address_2", "shipping_address_3", "shipping_country", "shipping_city",
      "shipping_zip_code", "shipping_state", "shipping_phone_number", "shipping_passport_id",
      "shipping_barangay", "sameAsShipping", "billing_first_name", "billing_middle_name",
      "billing_last_name", "billing_japanese_first_name", "billing_japanese_last_name",
      "billing_address", "billing_address_2", "billing_address_3", "billing_barangay",
      "billing_country", "billing_city", "billing_zip_code", "billing_state",
      "billing_phone_number", "billing_passport_id", "email", "card_number",
      "cvv", "expiry_month", "expiry_year"
    ],
    transform: (g, p, index = 0) => {
      const expYear = p.card.exp.split("/")[1];
      const fullExpYear = expYear.length === 2 ? `20${expYear}` : expYear;

      return [
        `${g}_${index + 1}`,
        p.shippingAddress.firstName,
        "",
        p.shippingAddress.lastName,
        "",
        "",
        p.shippingAddress.address1,
        p.shippingAddress.address2 || "",
        "",
        p.shippingAddress.country,
        p.shippingAddress.city,
        p.shippingAddress.zipCode,
        getStateAbbr(p.shippingAddress.state),
        p.phone.replace(/\D/g, ''),
        "",
        "",
        "FALSE",
        p.billingAddress.firstName,
        "",
        p.billingAddress.lastName,
        "",
        "",
        p.billingAddress.address1,
        p.billingAddress.address2 || "",
        "",
        "",
        p.billingAddress.country,
        p.billingAddress.city,
        p.billingAddress.zipCode,
        getStateAbbr(p.billingAddress.state),
        p.phone.replace(/\D/g, ''),
        "",
        p.email,
        p.card.number,
        p.card.cvv,
        p.card.exp.split("/")[0],
        fullExpYear
      ]
    },
    filename: "shitbot_profiles.csv",
  },

  /* Swft AIO Format (CSV) */
  "Swft AIO Format": {
    label: "Swft AIO Format (CSV)",
    fileType: "csv",
    headers: [
      "Profile Name", "Shipping First Name", "Shipping Last Name", "Shipping Address 1",
      "Shipping Address 2", "Shipping State", "Shipping City", "Shipping Zip Code",
      "Billing Same as Ship", "Billing First Name", "Billing Last Name",
      "Billing Address 1", "Billing Address 2", "Billing State", "Billing City",
      "Billing Zip Code", "Phone", "Email", "CC Number", "CC Year", "CC Month",
      "CVV", "CC Type"
    ],
    transform: (g, p, index = 0) => {
      const cardTypeMap: Record<string, string> = {
        'visa': 'VISA',
        'mastercard': 'MASTERCARD',
        'amex': 'AMEX',
        'discover': 'DISCOVER',
        'unknown': 'VISA'
      };

      const cardType = detectCardType(p.card.number);

      return [
        `${g}_${index + 1}`,
        p.shippingAddress.firstName,
        p.shippingAddress.lastName,
        p.shippingAddress.address1,
        p.shippingAddress.address2 || "",
        getStateAbbr(p.shippingAddress.state),
        p.shippingAddress.city,
        p.shippingAddress.zipCode,
        "FALSE",
        p.billingAddress.firstName,
        p.billingAddress.lastName,
        p.billingAddress.address1,
        p.billingAddress.address2 || "",
        getStateAbbr(p.billingAddress.state),
        p.billingAddress.city,
        p.billingAddress.zipCode,
        p.phone.replace(/\D/g, ''),
        p.email,
        p.card.number,
        `20${p.card.exp.split("/")[1]}`,
        p.card.exp.split("/")[0],
        p.card.cvv,
        cardTypeMap[cardType]
      ]
    },
    filename: "swft_profiles.csv",
  },

  /* Cyber Format (JSON) */
  "Cyber Format": {
    label: "Cyber Format (JSON)",
    fileType: "json",
    transform: (g, p) => {
      const randomId = generateAlphaNumericId(8, true);
      return {
        id: randomId,
        name: g,
        profiles: [{
          id: randomId,
          name: p.firstName + " " + p.lastName,
          email: p.email,
          phone: p.phone.replace(/\D/g, ''),
          billingDifferent: true,
          card: {
            number: p.card.number,
            expMonth: p.card.exp.split("/")[0],
            expYear: `20${p.card.exp.split("/")[1]}`,
            cvv: p.card.cvv,
          },
          delivery: {
            firstName: p.shippingAddress.firstName,
            lastName: p.shippingAddress.lastName,
            address1: p.shippingAddress.address1,
            address2: p.shippingAddress.address2 || "",
            zip: p.shippingAddress.zipCode,
            city: p.shippingAddress.city,
            country: p.shippingAddress.country,
            state: p.shippingAddress.state,
          },
          billing: {
            firstName: p.billingAddress.firstName,
            lastName: p.billingAddress.lastName,
            address1: p.billingAddress.address1,
            address2: p.billingAddress.address2 || "",
            zip: p.billingAddress.zipCode,
            city: p.billingAddress.city,
            country: p.billingAddress.country,
            state: p.billingAddress.state,
          }
        }]
      }
    },
    filename: "cyber_profiles.json",
  },

  /* Alpine Format (JSON) */
  "Alpine Format": {
    label: "Alpine Format (JSON)",
    fileType: "json",
    transform: (g, p, index = 0) => ({
      name: `${g}_${index + 1}`,
      email: p.email,
      phoneNumber: p.phone.replace(/\D/g, ''),
      sameAddress: false,
      shippingAddress: {
        addressLine1: p.shippingAddress.address1,
        addressLine2: p.shippingAddress.address2 || "",
        city: p.shippingAddress.city,
        zip: p.shippingAddress.zipCode,
        region: "",
        state: getStateAbbr(p.shippingAddress.state),
        countryCode: p.shippingAddress.country,
        firstName: p.shippingAddress.firstName,
        lastName: p.shippingAddress.lastName,
      },
      billingAddress: {
        addressLine1: p.billingAddress.address1,
        addressLine2: p.billingAddress.address2 || "",
        city: p.billingAddress.city,
        zip: p.billingAddress.zipCode,
        region: "",
        state: getStateAbbr(p.billingAddress.state),
        countryCode: p.billingAddress.country,
        firstName: p.billingAddress.firstName,
        lastName: p.billingAddress.lastName,
      },
      card: {
        cardNumber: p.card.number,
        cvv: p.card.cvv,
        expiryMonth: p.card.exp.split("/")[0],
        expiryYear: p.card.exp.split("/")[1],
      }
    }),
    filename: "alpine_profiles.json",
  },

  /* Shikari Format (CSV) */
  "Shikari Format": {
    label: "Shikari Format (CSV)",
    fileType: "csv",
    headers: [
      "profile_name", "first_name", "last_name", "email", "phone_num",
      "cc_number", "cc_exp_month", "cc_exp_year", "cc_cvv",
      "shipping_street", "shipping_street_2", "shipping_city",
      "shipping_state", "shipping_zip_code", "shipping_country",
      "billing_first_name", "billing_last_name", "billing_street",
      "billing_street_2", "billing_city", "billing_state",
      "billing_zip_code", "billing_country"
    ],
    transform: (g, p) => {
      const expMonth = p.card.exp.split("/")[0];
      // Remove leading zero if present
      const cleanExpMonth = expMonth.startsWith('0') ? expMonth.substring(1) : expMonth;
      const expYear = p.card.exp.split("/")[1];
      const fullExpYear = expYear.length === 2 ? `20${expYear}` : expYear;

      return [
        g,
        p.shippingAddress.firstName,
        p.shippingAddress.lastName,
        p.email,
        p.phone.replace(/\D/g, ''),
        p.card.number,
        cleanExpMonth,
        fullExpYear,
        p.card.cvv,
        p.shippingAddress.address1,
        p.shippingAddress.address2 || "",
        p.shippingAddress.city,
        getStateAbbr(p.shippingAddress.state),
        p.shippingAddress.zipCode,
        p.shippingAddress.country,
        p.billingAddress.firstName,
        p.billingAddress.lastName,
        p.billingAddress.address1,
        p.billingAddress.address2 || "",
        p.billingAddress.city,
        getStateAbbr(p.billingAddress.state),
        p.billingAddress.zipCode,
        p.billingAddress.country
      ]
    },
    filename: "shikari_profiles.csv",
  },

  /* Hidden Format (CSV) */
  "Hidden Format": {
    label: "Hidden Format (CSV)",
    fileType: "csv",
    headers: [
      "profileName", "billingFirstName", "billingLastName", "billingEmail",
      "billingPhone", "billingLine1", "billingLine2", "billingLine3",
      "billingPostCode", "billingCity", "billingCountry", "billingState",
      "shippingFirstName", "shippingLastName", "shippingEmail", "shippingPhone",
      "shippingLine1", "shippingLine2", "shippingLine3",
      "shippingPostCode", "shippingCity", "shippingCountry", "shippingState",
      "cardFirstName", "cardLastName", "cardType", "cardNumber",
      "cardExpMonth", "cardExpYear", "cardCvv",
      "sameBillingAndShippingAddress", "onlyCheckoutOnce", "accountEmail", "profileId"
    ],
    transform: (g, p) => {
      // Country code mapping
      const countryPhoneCodes: { [key: string]: string } = {
        'US': '1', 'GB': '44', 'CA': '1', 'AU': '61', 'DE': '49',
        'FR': '33', 'IT': '39', 'ES': '34', 'NL': '31', 'BE': '32',
        'CH': '41', 'AT': '43', 'SE': '46', 'NO': '47', 'DK': '45',
        'FI': '358', 'IE': '353', 'NZ': '64', 'JP': '81', 'CN': '86',
        'IN': '91', 'BR': '55', 'MX': '52', 'AR': '54', 'CL': '56',
        'CO': '57', 'PE': '51', 'VE': '58', 'ZA': '27', 'RU': '7',
        'TR': '90', 'IL': '972', 'AE': '971', 'SA': '966', 'SG': '65',
        'MY': '60', 'TH': '66', 'VN': '84', 'PH': '63', 'ID': '62'
      };

      // Get country code based on shipping address country, default to US (1)
      const countryCode = countryPhoneCodes[p.shippingAddress.country] || '1';
      // Format phone with + without using escape characters
      const phoneFormatted = countryCode + p.phone.replace(/\D/g, '');
      const cardType = detectCardType(p.card.number).toUpperCase();
      const uuid = uuidv4();

      return [
        g,
        p.billingAddress.firstName || p.firstName,
        p.billingAddress.lastName || p.lastName,
        p.email,
        "+" + phoneFormatted,
        p.billingAddress.address1,
        p.billingAddress.address2 || "",
        "",
        p.billingAddress.zipCode,
        p.billingAddress.city,
        p.billingAddress.country,
        getStateAbbr(p.billingAddress.state),
        p.shippingAddress.firstName || p.firstName,
        p.shippingAddress.lastName || p.lastName,
        p.email, // Added missing shippingEmail
        "+" + phoneFormatted, // Added missing shippingPhone
        p.shippingAddress.address1,
        p.shippingAddress.address2 || "",
        "",
        p.shippingAddress.zipCode,
        p.shippingAddress.city,
        p.shippingAddress.country,
        getStateAbbr(p.shippingAddress.state),
        p.firstName,
        p.lastName,
        cardType,
        p.card.number,
        p.card.exp.split("/")[0],
        `20${p.card.exp.split("/")[1]}`,
        p.card.cvv,
        "true",
        "false",
        p.email,
        uuid,
      ];
    },
    filename: "hidden_profiles.csv"
  },

  /* Nexar Format (CSV) */
  "Nexar Format": {
    label: "Nexar Format (CSV)",
    fileType: "csv",
    headers: [
      "profileName", "billingFirstName", "billingLastName", "billingEmail",
      "billingPhone", "billingLine1", "billingLine2", "billingLine3",
      "billingPostCode", "billingCity", "billingCountry", "billingState",
      "shippingFirstName", "shippingLastName", "shippingEmail", "shippingPhone",
      "shippingLine1", "shippingLine2", "shippingLine3",
      "shippingPostCode", "shippingCity", "shippingCountry", "shippingState",
      "cardFirstName", "cardLastName", "cardType", "cardNumber",
      "cardExpMonth", "cardExpYear", "cardCvv",
      "sameBillingAndShippingAddress", "onlyCheckoutOnce", "accountEmail", "profileId"
    ],
    transform: (g, p) => {
      // Country code mapping
      const countryPhoneCodes: { [key: string]: string } = {
        'US': '1', 'GB': '44', 'CA': '1', 'AU': '61', 'DE': '49',
        'FR': '33', 'IT': '39', 'ES': '34', 'NL': '31', 'BE': '32',
        'CH': '41', 'AT': '43', 'SE': '46', 'NO': '47', 'DK': '45',
        'FI': '358', 'IE': '353', 'NZ': '64', 'JP': '81', 'CN': '86',
        'IN': '91', 'BR': '55', 'MX': '52', 'AR': '54', 'CL': '56',
        'CO': '57', 'PE': '51', 'VE': '58', 'ZA': '27', 'RU': '7',
        'TR': '90', 'IL': '972', 'AE': '971', 'SA': '966', 'SG': '65',
        'MY': '60', 'TH': '66', 'VN': '84', 'PH': '63', 'ID': '62'
      };

      // Get country code based on shipping address country, default to US (1)
      const countryCode = countryPhoneCodes[p.shippingAddress.country] || '1';
      const phoneFormatted = countryCode + p.phone.replace(/\D/g, '');
      const cardType = detectCardType(p.card.number).toUpperCase();
      const uuid = uuidv4();

      return [
        g,
        p.billingAddress.firstName || p.firstName,
        p.billingAddress.lastName || p.lastName,
        p.email,
        "+" + phoneFormatted,
        p.billingAddress.address1,
        p.billingAddress.address2 || "",
        "",
        p.billingAddress.zipCode,
        p.billingAddress.city,
        p.billingAddress.country,
        getStateAbbr(p.billingAddress.state),
        p.shippingAddress.firstName || p.firstName,
        p.shippingAddress.lastName || p.lastName,
        p.email, // Added missing shippingEmail
        "+" + phoneFormatted, // Added missing shippingPhone
        p.shippingAddress.address1,
        p.shippingAddress.address2 || "",
        "",
        p.shippingAddress.zipCode,
        p.shippingAddress.city,
        p.shippingAddress.country,
        getStateAbbr(p.shippingAddress.state),
        p.firstName,
        p.lastName,
        cardType,
        p.card.number,
        p.card.exp.split("/")[0],
        p.card.exp.split("/")[1],
        p.card.cvv,
        "true",
        "false",
        p.email,
        uuid,
      ];
    },
    filename: "nexar_profiles.csv",
  },

  /* Astral Format (JSON) */
  "Astral Format": {
    label: "Astral Format (JSON)",
    fileType: "json",
    transform: (g, p, index = 0) => {
      const uuid = uuidv4();
      const groupUuid = uuidv4();
      const expMonth = p.card.exp.split("/")[0];
      const expYear = p.card.exp.split("/")[1];
      const fullExpYear = expYear.length === 2 ? `20${expYear}` : expYear;

      return {
        name: p.firstName + " " + p.lastName,
        profilename: `${g}_${index + 1}`,
        zipcode: p.shippingAddress.zipCode,
        city: p.shippingAddress.city,
        state: getStateAbbr(p.shippingAddress.state),
        aptunit: p.shippingAddress.address2 || "",
        streetaddress: p.shippingAddress.address1,
        telephone: p.phone.replace(/\D/g, ''),
        email: p.email,
        cardnumber: p.card.number,
        expirationmonth: expMonth,
        expirationyear: fullExpYear,
        cvv: p.card.cvv,
        country: p.shippingAddress.country === "US" ? "USA" : p.shippingAddress.country,
        group: groupUuid,
        billingName: p.billingAddress.firstName + " " + p.billingAddress.lastName,
        billingEmail: p.email,
        billingTelephone: p.phone.replace(/\D/g, ''),
        billingStreetaddress: p.billingAddress.address1,
        billingAptunit: p.billingAddress.address2 || "",
        billingState: getStateAbbr(p.billingAddress.state),
        billingCountry: p.billingAddress.country === "US" ? "USA" : p.billingAddress.country,
        billingCity: p.billingAddress.city,
        billingZipcode: p.billingAddress.zipCode,
        sameBilling: false,
        id: uuid,
        lastUpdated: Date.now()
      };
    },
    filename: "astral_profiles.json",
  },

};
