import { faker } from '@faker-js/faker';
import Profile from "../types/profile";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { botFormats } from "../services/botFormat";
import { toast } from "sonner"

function fourDigits() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const cardTypeImages = {
  visa: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg",
  mastercard: "https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png",
  amex: "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg",
  discover: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Discover_Card_logo.svg",
  unknown: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/No_image_available.svg/480px-No_image_available.svg.png"
};

export const getCardType = (number: string) => {
  const raw = number.replace(/\D/g, "");

  if (/^4/.test(raw)) return "visa";
  if (/^5[1-5]/.test(raw) || /^2(2[2-9]|[3-6]|7[01]|720)/.test(raw)) return "mastercard";
  if (/^3[47]/.test(raw)) return "amex";
  if (/^6(?:011|5|4[4-9]|22)/.test(raw)) return "discover";

  return "unknown";
};

export const generateRandomName = (address: any, options: any) => {
  return {
    firstName: options.randomFirstName ? faker.person.firstName() : address.firstName,
    lastName: options.randomLastName ? faker.person.firstName() : address.lastName
  };
};

export const generateRandomEmail = (emailType: string, emailValue: string) => {
  switch (emailType) {
    case "single":
      return emailValue
    case "catchall":
      return `${faker.person.firstName()}.${faker.person.lastName()}${fourDigits()}@${emailValue.replace("@", "")}`
    case "random":
      const email = faker.internet
        .userName()
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
      const domain = ["gmail.com", "outlook.com"][Math.floor(Math.random() * 2)];
      return `${email}${fourDigits()}@${domain}`;

    default:
      return faker.internet.email()
  }
}

export const generateRandomPhone = (phoneType: string, phoneValue: string) => {
  switch (phoneType) {
    case "single":
      return phoneValue;
    case "random":
      return faker.phone.number({
        style: "national",
      });
    case "areaCode": {
      const local = faker.helpers.replaceSymbols("###-####");
      return `(${phoneValue}) ${local}`;
    }
    default:
      return faker.phone.number();
  }
}

export const setFields = (fields: Map<Function, any>) => {
  for (const [fn, arg] of fields.entries()) {
    fn(arg);
  }
};

export const generateRandomPrefixSuffix = () => {
  return faker.string.alpha(3)
}

export const generateRandomAddress = () => {
  return faker.location.secondaryAddress()
}


export function exportForBot(botKey: string, fileName: string, payload: Profile[] | any) {
  const bot = botFormats[botKey];
  if (!bot) throw new Error(`Unknown bot: ${botKey}`);

  if (bot.fileType === "csv") {
    const csv = Papa.unparse({ fields: bot.headers || [''], data: payload as any[] });
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), fileName);
  } else if (bot.fileType === "json") {
    saveAs(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      fileName
    );
  } else if (bot.fileType === "hayha") {
    saveAs(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      fileName
    );
  }
}

export function formatProfilesForBot(groupName: string, profiles: Profile[], botKey: string) {
  const bot = botFormats[botKey]
  if (!bot) throw new Error(`Unknown bot: ${botKey}`)
  return profiles.map((e, index) => bot.transform(groupName, e, index));
}

type ToastType = "success" | "error" | "info"
type ToastParams = {
  message: string
  type?: ToastType
  description?: string
}

export const showToast = ({ message, type = "info", description }: ToastParams) => {
  const baseOptions = {
    description,
    duration: 4000,
    classNames: {
      description: "text-white/80", // This targets the description element
    },
  }

  switch (type) {
    case "success":
      toast.success(message, {
        ...baseOptions,
        classNames: {
          ...baseOptions.classNames,
          toast: "bg-green-600 text-white",
          title: "text-white",
        },
      })
      break

    case "error":
      toast.error(message, {
        ...baseOptions,
        classNames: {
          ...baseOptions.classNames,
          toast: "bg-red-600 text-white",
        },
      })
      break

    case "info":
    default:
      toast(message, {
        ...baseOptions,
        classNames: {
          ...baseOptions.classNames,
          toast: "bg-blue-600 text-white",
        },
      })
      break
  }
}