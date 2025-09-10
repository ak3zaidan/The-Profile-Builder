"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Profile, UserCreditCard } from "../types/profile"
import LabeledSelect from "../components/dropdown"
import { motion, AnimatePresence } from "framer-motion"
import { showToast, cardTypeImages, getCardType } from "./helper"
import PoweredBy from "../components/poweredBy"

import {
  exportForBot,
  formatProfilesForBot,
  generateRandomEmail,
  generateRandomName,
  generateRandomPhone,
  generateRandomAddress,
  setFields,
  generateRandomPrefixSuffix
} from "./helper"

import {
  Download,
  Users,
  Loader2,
  LogOut,
  Plus,
  FileUser,
  MapPinHouse,
  NotebookTabs,
  CreditCard,
  Trash2,
  Upload,
} from "lucide-react"
import { useRouter } from "next/navigation"
import ProfileCard from "../components/profileCard"
import { botFormats } from "../services/botFormat"

// Import detectCardType function
const detectCardType = (cardNumber: string): string => {
  const num = cardNumber.replace(/\D/g, '');
  if (/^4/.test(num)) return "visa";
  if (/^5[1-5]/.test(num)) return "mastercard";
  if (/^3[47]/.test(num)) return "amex";
  if (/^6/.test(num)) return "discover";
  return "unknown";
}

// Import uuidv4 function
const uuidv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
import AiJigModal from "../components/popup"
import ExtendVCCManager from "../components/ExtendVCCManager"
import { Modal } from "antd"
import CountryPicker from "../components/countryPicker"

export default function ProfileBuilder() {

  const router = useRouter();

  const [showVCCManager, setShowVCCManager] = useState(false)
  const [shouldResetVCC, setShouldResetVCC] = useState(false);
  const [showEditAllModal, setShowEditAllModal] = useState(false);

  // Edit all form state
  const [editAllFields, setEditAllFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shippingFirstName: '',
    shippingLastName: '',
    shippingAddress1: '',
    shippingAddress2: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
    billingFirstName: '',
    billingLastName: '',
    billingAddress1: '',
    billingAddress2: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
    cardHolderName: '',
    cardNumber: '',
    cardExp: '',
    cardCvv: ''
  });

  const [groupName, setGroupName] = useState("")
  const [profileCount, setProfileCount] = useState(1)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [editingProfile, setEditingProfile] = useState<string | null>(null)
  const [exportType, setExportType] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [importFormat, setImportFormat] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [emailType, setEmailType] = useState("single")
  const [emailValue, setEmailValue] = useState("")
  const [phoneType, setPhoneType] = useState("single")
  const [phoneValue, setPhoneValue] = useState("")
  const [cardType, setCardType] = useState("manual")
  const [importedEmails, setImportedEmails] = useState<string[]>([])
  const [importedCards, setImportedCards] = useState<UserCreditCard[]>([])
  const [cvvLength, setCvvLength] = useState(3)
  const [jigs, setGeneratedAddress] = useState<string[]>([])
  const [cardInfo, setCardInfo] = useState<UserCreditCard>({
    "holderName": "",
    "number": "",
    "exp": "",
    "cvv": ""
  })
  const [shippingOptions, setShippingOptions] = useState({
    "randomAddress1": false,
    "randomAddress2": false,
    "randomPrefix": false,
    "randomFirstName": false,
    "randomLastName": false,
  })
  const [billingOptions, setBillingOptions] = useState({
    "randomAddress1": false,
    "randomAddress2": false,
    "randomPrefix": false,
    "randomFirstName": false,
    "randomLastName": false,
  })
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    zipCode: "",
    state: "",
    city: "",
    country: "US",
    countryName: "United States"
  })
  const [billingAddress, setBillingAddress] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    zipCode: "",
    city: "",
    state: "",
    country: "US",
    countryName: "United States"
  });

  const [show, setShow] = useState(false)
  const [status, setStatus] = useState(false)

  const [useSameAsShipping, setUseSameAsShipping] = useState(true);

  const [currentPage, setCurrentPage] = useState(1)
  const [vccCards, setVccCards] = useState<UserCreditCard[]>([]);
  const itemsPerPage = 5

  const modalStyles = {
    mask: {
      backdropFilter: 'blur(10px)',
    },
  };

  const totalPages = Math.ceil(profiles.length / itemsPerPage)

  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return profiles.slice(start, start + itemsPerPage)
  }, [profiles, currentPage])


  useEffect(() => {
    const checkAcces = async () => {
      const userId = document.cookie.split("; ").find(row => row.startsWith("userId="))?.split("=")[1];
      if (!userId) {
        router.push("/");
        return;
      }
      const response = await fetch("/api/oauth/subscription/status");
      const data = await response.json();

      if (!response.ok || !data.subscribed) {
        handleLogout()
        return;
      }
      setStatus(true);
    }
    checkAcces();
  }, []);

  useEffect(() => {
    // Preserve current page across profile content edits; only adjust if out of range
    setCurrentPage((prev) => {
      const pages = Math.max(1, Math.ceil(profiles.length / itemsPerPage))
      return Math.min(prev, pages)
    })
  }, [totalPages])

  // Debug effect to monitor profiles state
  useEffect(() => {

  }, [profiles])

  useEffect(() => {

    if (useSameAsShipping) {
      setBillingAddress({
        ...shippingAddress,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
      });
      setBillingOptions({
        ...shippingOptions,
        randomFirstName: shippingOptions.randomFirstName,
        randomLastName: shippingOptions.randomLastName,
      });
    }
  }, [useSameAsShipping, shippingAddress, shippingOptions]);
  const emailFileRef = useRef<HTMLInputElement>(null)
  const cardFileRef = useRef<HTMLInputElement>(null)

  const handleLogout = async () => {
    await fetch("/api/oauth/logout");
    router.push("/");
  }



  const handleProfilesBuilt = (cards: UserCreditCard[]) => {
    setVccCards(cards);
    setShowVCCManager(false);
    setShouldResetVCC(true);

    // Reset the flag after a short delay to ensure modal reset happens
    setTimeout(() => {
      setShouldResetVCC(false);
    }, 100);
  };



  // Function to fetch city and state from zip code (US only)
  const fetchLocationFromZip = async (zipcode: string, country: string) => {
    try {
      const response = await fetch(`/api/location?zipcode=${zipcode}&country=${country}`);
      const data = await response.json();

      if (!response.ok) {
        // Only show error for US zip codes
        if (country === 'US' && data.error) {
          showToast({
            type: "error",
            message: data.error
          });
        }
        return null;
      }

      return data;
    } catch (error) {
      // Don't show any error, just return null
      return null;
    }
  };

  // Handle shipping address zip code changes
  useEffect(() => {
    const zipcode = shippingAddress.zipCode;
    const country = shippingAddress.country;

    // Only try to fetch city/state for US addresses with non-empty zip
    if (country === 'US' && zipcode.trim()) {
      const timeout = setTimeout(async () => {
        const data = await fetchLocationFromZip(zipcode, country);
        if (data) {
          setShippingAddress((prev) => ({
            ...prev,
            city: data.city,
            state: data.state,
          }));
          // If using same as shipping, update billing address too
          if (useSameAsShipping) {
            setBillingAddress((prev) => ({
              ...prev,
              zipCode: zipcode,
              city: data.city,
              state: data.state,
              country: country,
            }));
          }
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [shippingAddress.zipCode, shippingAddress.country, useSameAsShipping]);

  // Handle billing address zip code changes
  useEffect(() => {
    const zipcode = billingAddress.zipCode;
    const country = billingAddress.country;

    // Skip if user has checked "Same as Shipping"
    if (useSameAsShipping) return;

    // Only try to fetch city/state for US addresses with non-empty zip
    if (country === 'US' && zipcode.trim()) {
      const timeout = setTimeout(async () => {
        const data = await fetchLocationFromZip(zipcode, country);
        if (data) {
          setBillingAddress((prev) => ({
            ...prev,
            city: data.city,
            state: data.state,
          }));
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [billingAddress.zipCode, billingAddress.country, useSameAsShipping]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return domainRegex.test(domain)
  }

  const getCardDetails = (index: number) => {
    if (importedCards.length) {
      return importedCards[index % importedCards.length];
    }

    if (vccCards.length > 0) {
      return vccCards[index % vccCards.length];
    }

    return cardInfo;
  }


  const createEmptyProfile = (index: number, jigs: string[]): Profile => {
    const { firstName: shippingFirstName, lastName: shippingLastName } = generateRandomName(shippingAddress, shippingOptions)
    const { firstName: billingFirstName, lastName: billingLastName } = generateRandomName(billingAddress, billingOptions)

    let shippingAddress1 = ""
    if (jigs.length > 0) {
      shippingAddress1 = jigs[index % jigs.length]
    } else {
      shippingAddress1 = `${shippingOptions.randomPrefix ? generateRandomPrefixSuffix() + " " : ""}${shippingAddress.address1}`
    }

    const shippingAddress2 = shippingOptions.randomAddress2 ? generateRandomAddress() : shippingAddress.address2;
    const billingAddress1 = billingOptions.randomPrefix ? generateRandomPrefixSuffix() + " " + billingAddress.address1 : billingAddress.address1;
    const billingAddress2 = billingOptions.randomAddress2 ? generateRandomAddress() : billingAddress.address2;

    return {
      id: Math.random().toString(36).substr(2, 9),
      firstName: shippingFirstName,
      lastName: shippingLastName,
      email: importedEmails.length > 0
        ? importedEmails[index % importedEmails.length]
        : generateRandomEmail(emailType, emailValue),
      phone: generateRandomPhone(phoneType, phoneValue),
      shippingAddress: {
        ...shippingAddress,
        firstName: shippingFirstName,
        lastName: shippingLastName,
        address1: shippingAddress1,
        address2: shippingAddress2,
      },
      billingAddress: {
        ...billingAddress,
        firstName: useSameAsShipping ? shippingFirstName : billingFirstName,
        lastName: useSameAsShipping ? shippingLastName : billingLastName,
        address1: useSameAsShipping ? shippingAddress1 : billingAddress1,
        address2: useSameAsShipping ? shippingAddress2 : billingAddress2,
      },
      card: getCardDetails(index),
    }
  }

  const getAIAddress = async () => {
    setShow(true)
  }

  const createProfiles = async (jigs: string[]) => {
    let index = 0;

    const newProfiles = Array.from({ length: profileCount }, () => {
      const profile = createEmptyProfile(index, jigs)
      index += 1
      return profile
    })
    setProfiles(newProfiles)
    showToast({
      message: `Generated ${newProfiles.length} profiles`,
      type: "info"
    })
  }

  const generateProfiles = async () => {
    // setShowVCCManager(true)
    if (shippingOptions.randomAddress1 && !jigs) {
      return
    }
    if (validateCreation(true)) return

    if (shippingOptions.randomAddress1) {
      await getAIAddress();
    } else {
      await createProfiles([])
    }
  }

  const handleEmailFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".csv")) {
      showToast({ message: "Please upload a valid .txt or .csv file", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let emails: string[] = [];

      if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter((line) => line.trim());
        if (lines.length === 0) {
          showToast({ message: "No data found in CSV file", type: "error" });
          return;
        }

        for (let i = 0; i < lines.length; i++) {
          const columns = lines[i].split(",").map((col) => col.trim().replace(/"/g, ""));
          const emailColumn = columns.find((col) => validateEmail(col));
          if (emailColumn) {
            emails.push(emailColumn);
          }
        }
      } else {
        // .txt file
        emails = text
          .split("\n")
          .map((line) => line.trim().split(":")[0])
          .filter((email) => email);
      }

      const validEmails = emails.filter(validateEmail);

      if (validEmails.length === 0) {
        showToast({ message: "No valid emails found in the file", type: "error" });
        return;
      }

      if (validEmails.length !== emails.length) {
        showToast({ message: "Some emails were invalid and ignored", type: "info" });
      } else {
        showToast({ message: `Imported ${validEmails.length} emails`, type: "info" });
      }

      setImportedEmails(validEmails);
    };

    reader.readAsText(file);
  };


  const handleCardFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      showToast({ message: "Please upload a valid .csv file", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        showToast({ message: "No card data found in file", type: "error" });
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredHeaders = ["card holder name", "card number", "exp month", "exp year", "cvv"];
      if (headers.join() !== requiredHeaders.join()) {
        showToast({ message: "CSV headers must match required format", type: "error" });
        return;
      }

      const cards: UserCreditCard[] = [];
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(",").map((col) => col.trim().replace(/"/g, ""));
        if (columns.length < 5) continue;

        const [holderName, number, expMonth, expYear, cvv] = columns;

        if (!holderName || !number || !expMonth || !expYear || !cvv) continue;

        // Basic length checks
        const digitsOnly = number.replace(/\D/g, "");
        const isAmex = digitsOnly.length === 15;
        const isVisaOrMC = digitsOnly.length === 16;

        if (!isAmex && !isVisaOrMC) continue;

        cards.push({
          holderName,
          number,
          exp: `${expMonth}/${expYear}`,
          cvv,
        });
      }

      if (cards.length === 0) {
        showToast({ message: "No valid cards found", type: "error" });
        return;
      }

      setImportedCards(cards);
      showToast({ message: `Imported ${cards.length} cards successfully`, type: "success" });
    };

    reader.readAsText(file);
  };

  const handleImportFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFile(file);
  };

  // Helper function to validate imported profile has required fields
  const validateImportedProfile = (profile: Profile, formatKey: string): string | null => {
    // Check for empty or missing required fields
    if (!profile.firstName?.trim()) {
      return "First name is required";
    }
    if (!profile.lastName?.trim()) {
      return "Last name is required";
    }
    if (!profile.email?.trim()) {
      return "Email is required";
    }
    if (!profile.phone?.trim()) {
      return "Phone number is required";
    }
    if (!profile.shippingAddress?.address1?.trim()) {
      return "Shipping address is required";
    }
    if (!profile.shippingAddress?.city?.trim()) {
      return "Shipping city is required";
    }
    if (!profile.shippingAddress?.state?.trim()) {
      return "Shipping state is required";
    }
    if (!profile.shippingAddress?.zipCode?.trim()) {
      return "Shipping zip code is required";
    }
    if (!profile.card?.number?.trim()) {
      return "Card number is required";
    }
    if (!profile.card?.exp?.trim()) {
      return "Card expiration is required";
    }
    if (!profile.card?.cvv?.trim()) {
      return "Card CVV is required";
    }

    return null; // No validation errors
  };

  const handleImportProfiles = async () => {
    if (!importFile || !importFormat) {
      showToast({
        message: "Please select a file and format",
        type: "error"
      });
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        let importedProfiles: Profile[] = [];

        if (importFile.name.endsWith('.csv')) {
          // Parse CSV format
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            throw new Error('File must contain at least a header row and one data row');
          }

          const fileHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));


          // Get the selected format to understand the expected structure
          const selectedFormat = botFormats[importFormat];
          if (!selectedFormat) {
            throw new Error('Invalid format selected');
          }

          // Validate headers match the expected format
          if (selectedFormat.headers) {
            const missingHeaders = selectedFormat.headers.filter(header =>
              !fileHeaders.some(fileHeader =>
                fileHeader.toLowerCase() === header.toLowerCase() ||
                fileHeader.toLowerCase().replace(/[^a-z0-9]/g, '') === header.toLowerCase().replace(/[^a-z0-9]/g, '')
              )
            );

            if (missingHeaders.length > 0) {
              showToast({
                message: "Format Mismatch Warning",
                description: `Missing required headers: ${missingHeaders.join(', ')}. Please check your file format.`,
                type: "error"
              });
              return;
            }
          }

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length >= fileHeaders.length) {
              const profile: any = {};
              fileHeaders.forEach((header, index) => {
                profile[header] = values[index] || '';
              });

              // Convert from export format back to Profile structure
              try {
                const newProfile = convertFromExportFormat(profile, importFormat);
                if (newProfile) {
                  // Validate that the converted profile has required fields
                  const validationError = validateImportedProfile(newProfile, importFormat);
                  if (validationError) {
                    showToast({
                      message: "Invalid Profile Data",
                      description: `Profile ${i}: ${validationError}`,
                      type: "error"
                    });
                    continue; // Skip this profile and continue with next
                  }

                  newProfile.id = `imported-${Date.now()}-${i}`;
                  importedProfiles.push(newProfile);
                }
              } catch (error) {
                showToast({
                  message: "Profile Conversion Error",
                  description: `Profile ${i}: ${error instanceof Error ? error.message : "Failed to convert profile"}`,
                  type: "error"
                });
                continue; // Skip this profile and continue with next
              }
            }
          }
        } else if (importFile.name.endsWith('.json') || importFile.name.endsWith('.hayha') || importFile.name.endsWith('.Hayha')) {
          // Parse JSON format
          try {
            const data = JSON.parse(text);
            let profilesToProcess: any[] = [];

            // Handle different JSON structures
            if (Array.isArray(data)) {
              // Array of profiles
              profilesToProcess = data;
            } else if (typeof data === 'object' && data !== null) {
              // Object with UUID keys (like Valor Format)
              if (importFormat === "Valor Format") {
                profilesToProcess = Object.values(data);
              } else if (importFormat === "Cyber Format" && data.profiles && Array.isArray(data.profiles)) {
                // Cyber format has profiles in a profiles array
                profilesToProcess = data.profiles;
              } else {
                // Single profile object
                profilesToProcess = [data];
              }
            } else {
              showToast({
                message: "Format Mismatch Warning",
                description: "JSON file must contain an array of profiles or a valid profile object",
                type: "error"
              });
              return;
            }

            // Validate JSON structure
            if (profilesToProcess.length === 0) {
              showToast({
                message: "Format Mismatch Warning",
                description: "No valid profiles found in JSON file",
                type: "error"
              });
              return;
            }

            const sampleProfile = profilesToProcess[0];
            if (!sampleProfile || typeof sampleProfile !== 'object') {
              showToast({
                message: "Format Mismatch Warning",
                description: "JSON file must contain valid profile objects",
                type: "error"
              });
              return;
            }


            importedProfiles = profilesToProcess.map((profile: any, index: number) => {
              try {
                const convertedProfile = convertFromExportFormat(profile, importFormat);

                if (convertedProfile) {
                  // Validate that the converted profile has required fields
                  const validationError = validateImportedProfile(convertedProfile, importFormat);
                  if (validationError) {
                    showToast({
                      message: "Invalid Profile Data",
                      description: `Profile ${index + 1}: ${validationError}`,
                      type: "error"
                    });
                    return null; // Skip this profile
                  }

                  convertedProfile.id = `imported-${Date.now()}-${index}`;
                  return convertedProfile;
                }
                return null;
              } catch (error) {
                showToast({
                  message: "Profile Conversion Error",
                  description: `Profile ${index + 1}: ${error instanceof Error ? error.message : "Failed to convert profile"}`,
                  type: "error"
                });
                return null; // Skip this profile
              }
            }).filter(Boolean) as Profile[];

          } catch (error) {
            throw new Error('Invalid JSON format');
          }
        }

        if (importedProfiles.length > 0) {
          setProfiles(prev => {
            const newProfiles = [...prev, ...importedProfiles];
            return newProfiles;
          });

          showToast({
            message: "Import Completed",
            description: `Successfully imported ${importedProfiles.length} profile${importedProfiles.length !== 1 ? 's' : ''}. Invalid profiles were skipped.`,
            type: "success"
          });
          setImportFile(null);
          setImportFormat("");
          // Reset file input
          const fileInput = document.getElementById('importFile') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } else {
          showToast({
            message: "Import Failed",
            description: "No valid profiles found in file. All profiles failed validation or conversion.",
            type: "error"
          });
        }
      };
      reader.readAsText(importFile);
    } catch (error) {
      showToast({
        message: "Failed to import profiles",
        description: error instanceof Error ? error.message : "Invalid file format",
        type: "error"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Helper function to convert from export format back to Profile structure
  const convertFromExportFormat = (profile: any, formatKey: string): Profile | null => {
    try {
      switch (formatKey) {
        case "Make Format":
          return {
            id: "",
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            email: profile.email || "",
            phone: profile.phoneNumber || "",
            shippingAddress: {
              firstName: profile.firstName || "",
              lastName: profile.lastName || "",
              address1: profile.address1 || "",
              address2: profile.address2 || "",
              city: profile.city || "",
              state: profile.state || "",
              zipCode: profile.zipcode || "",
              country: profile.country || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.firstName || "",
              lastName: profile.lastName || "",
              address1: profile.address1 || "",
              address2: profile.address2 || "",
              city: profile.city || "",
              state: profile.state || "",
              zipCode: profile.zipcode || "",
              country: profile.country || "US",
              countryName: "United States"
            },
            card: {
              holderName: `${profile.firstName || ""} ${profile.lastName || ""}`,
              number: profile.ccNumber || "",
              exp: `${profile.ccMonth || ""}/${profile.ccYear || ""}`,
              cvv: profile.cvv || ""
            }
          };

        case "Valor Format":
          return {
            id: "",
            firstName: profile.shipping?.firstName || "",
            lastName: profile.shipping?.lastName || "",
            email: profile.email || "",
            phone: (profile.phoneNumber || "").replace(/\D/g, ''),
            shippingAddress: {
              firstName: profile.shipping?.firstName || "",
              lastName: profile.shipping?.lastName || "",
              address1: profile.shipping?.addressLine1 || "",
              address2: profile.shipping?.addressLine2 || "",
              city: profile.shipping?.city || "",
              state: profile.shipping?.state || "",
              zipCode: profile.shipping?.zipCode || "",
              country: profile.shipping?.countryCode || "US",
              countryName: profile.shipping?.countryName || "United States"
            },
            billingAddress: {
              firstName: profile.billing?.firstName || "",
              lastName: profile.billing?.lastName || "",
              address1: profile.billing?.addressLine1 || "",
              address2: profile.billing?.addressLine2 || "",
              city: profile.billing?.city || "",
              state: profile.billing?.state || "",
              zipCode: profile.billing?.zipCode || "",
              country: profile.billing?.countryCode || "US",
              countryName: profile.billing?.countryName || "United States"
            },
            card: {
              holderName: profile.card?.holder || "",
              number: profile.card?.number || "",
              exp: profile.card?.expiration || "",
              cvv: profile.card?.cvv || ""
            }
          };

        case "Stellar Format":
          return {
            id: "",
            firstName: profile.shipping?.firstName || profile.firstName || "",
            lastName: profile.shipping?.lastName || profile.lastName || "",
            email: profile.email || "",
            phone: profile.phone || "",
            shippingAddress: {
              firstName: profile.shipping?.firstName || profile.firstName || "",
              lastName: profile.shipping?.lastName || profile.lastName || "",
              address1: profile.shipping?.address || "",
              address2: profile.shipping?.address2 || "",
              city: profile.shipping?.city || "",
              state: profile.shipping?.state || "",
              zipCode: profile.shipping?.zipcode || "",
              country: profile.shipping?.country || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.billing?.firstName || profile.firstName || "",
              lastName: profile.billing?.lastName || profile.lastName || "",
              address1: profile.billing?.address || "",
              address2: profile.billing?.address2 || "",
              city: profile.billing?.city || "",
              state: profile.billing?.state || "",
              zipCode: profile.billing?.zipcode || "",
              country: profile.billing?.country || "US",
              countryName: "United States"
            },
            card: {
              holderName: profile.payment?.cardName || "",
              number: profile.payment?.cardNumber || "",
              exp: `${profile.payment?.cardMonth || ""}/${profile.payment?.cardYear || ""}`,
              cvv: profile.payment?.cardCvv || ""
            }
          };

        case "Refract Format":
          return {
            id: "",
            firstName: profile.shipping?.firstName || profile.firstName || "",
            lastName: profile.shipping?.lastName || profile.lastName || "",
            email: profile.email || "",
            phone: profile.shipping?.phone || "",
            shippingAddress: {
              firstName: profile.shipping?.firstName || profile.firstName || "",
              lastName: profile.shipping?.lastName || profile.lastName || "",
              address1: profile.shipping?.address1 || "",
              address2: profile.shipping?.address2 || "",
              city: profile.shipping?.city || "",
              state: profile.shipping?.province || "",
              zipCode: profile.shipping?.postalCode || "",
              country: profile.shipping?.country || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.billing?.firstName || profile.firstName || "",
              lastName: profile.billing?.lastName || profile.lastName || "",
              address1: profile.billing?.address1 || "",
              address2: profile.billing?.address2 || "",
              city: profile.billing?.city || "",
              state: profile.billing?.province || "",
              zipCode: profile.billing?.postalCode || "",
              country: profile.billing?.country || "US",
              countryName: "United States"
            },
            card: {
              holderName: profile.payment?.name || "",
              number: profile.payment?.num || "",
              exp: `${profile.payment?.month || ""}/${String(profile.payment?.year || "").slice(-2)}`,
              cvv: profile.payment?.cvv || ""
            }
          };

        case "NSB Format":
          return {
            id: "",
            firstName: profile.shipping?.firstname || profile.firstName || "",
            lastName: profile.shipping?.lastname || profile.lastName || "",
            email: profile.email || "",
            phone: profile.shipping?.phone || "",
            shippingAddress: {
              firstName: profile.shipping?.firstname || profile.firstName || "",
              lastName: profile.shipping?.lastname || profile.lastName || "",
              address1: profile.shipping?.address || "",
              address2: profile.shipping?.address2 || "",
              city: profile.shipping?.city || "",
              state: profile.shipping?.state || "",
              zipCode: profile.shipping?.zip || "",
              country: profile.shipping?.country || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.billing?.firstname || profile.firstName || "",
              lastName: profile.billing?.lastname || profile.lastName || "",
              address1: profile.billing?.address || "",
              address2: profile.billing?.address2 || "",
              city: profile.billing?.city || "",
              state: profile.billing?.state || "",
              zipCode: profile.billing?.zip || "",
              country: profile.billing?.country || "US",
              countryName: "United States"
            },
            card: {
              holderName: profile.name || "",
              number: profile.cc?.number || "",
              exp: profile.cc?.expiry ? profile.cc.expiry.replace(" / ", "/").replace(/\s+/g, "") : "",
              cvv: profile.cc?.cvc || ""
            }
          };

        case "Cyber Format":
          return {
            id: "",
            firstName: profile.delivery?.firstName || profile.firstName || "",
            lastName: profile.delivery?.lastName || profile.lastName || "",
            email: profile.email || "",
            phone: profile.phone || "",
            shippingAddress: {
              firstName: profile.delivery?.firstName || profile.firstName || "",
              lastName: profile.delivery?.lastName || profile.lastName || "",
              address1: profile.delivery?.address1 || "",
              address2: profile.delivery?.address2 || "",
              city: profile.delivery?.city || "",
              state: profile.delivery?.state || "",
              zipCode: profile.delivery?.zip || "",
              country: profile.delivery?.country || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.billing?.firstName || profile.firstName || "",
              lastName: profile.billing?.lastName || profile.lastName || "",
              address1: profile.billing?.address1 || "",
              address2: profile.billing?.address2 || "",
              city: profile.billing?.city || "",
              state: profile.billing?.state || "",
              zipCode: profile.billing?.zip || "",
              country: profile.billing?.country || "US",
              countryName: "United States"
            },
            card: {
              holderName: `${profile.delivery?.firstName || ""} ${profile.delivery?.lastName || ""}`,
              number: profile.card?.number || "",
              exp: `${profile.card?.expMonth || ""}/${String(profile.card?.expYear || "").slice(-2)}`,
              cvv: profile.card?.cvv || ""
            }
          };

        case "Alpine Format":
          return {
            id: "",
            firstName: profile.shippingAddress?.firstName || profile.firstName || "",
            lastName: profile.shippingAddress?.lastName || profile.lastName || "",
            email: profile.email || "",
            phone: profile.phoneNumber || "",
            shippingAddress: {
              firstName: profile.shippingAddress?.firstName || profile.firstName || "",
              lastName: profile.shippingAddress?.lastName || profile.lastName || "",
              address1: profile.shippingAddress?.addressLine1 || "",
              address2: profile.shippingAddress?.addressLine2 || "",
              city: profile.shippingAddress?.city || "",
              state: profile.shippingAddress?.state || "",
              zipCode: profile.shippingAddress?.zip || "",
              country: profile.shippingAddress?.countryCode || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.billingAddress?.firstName || profile.firstName || "",
              lastName: profile.billingAddress?.lastName || profile.lastName || "",
              address1: profile.billingAddress?.addressLine1 || "",
              address2: profile.billingAddress?.addressLine2 || "",
              city: profile.billingAddress?.city || "",
              state: profile.billingAddress?.state || "",
              zipCode: profile.billingAddress?.zip || "",
              country: profile.billingAddress?.countryCode || "US",
              countryName: "United States"
            },
            card: {
              holderName: `${profile.shippingAddress?.firstName || ""} ${profile.shippingAddress?.lastName || ""}`,
              number: profile.card?.cardNumber || "",
              exp: `${profile.card?.expiryMonth || ""}/${String(profile.card?.expiryYear || "").slice(-2)}`,
              cvv: profile.card?.cvv || ""
            }
          };

        case "ShitBot Format":
          return {
            id: "",
            firstName: profile.shipping_first_name || profile.first_name || "",
            lastName: profile.shipping_last_name || profile.last_name || "",
            email: profile.email || "",
            phone: profile.shipping_phone_number || "",
            shippingAddress: {
              firstName: profile.shipping_first_name || profile.first_name || "",
              lastName: profile.shipping_last_name || profile.last_name || "",
              address1: profile.shipping_address || "",
              address2: profile.shipping_address_2 || "",
              city: profile.shipping_city || "",
              state: profile.shipping_state || "",
              zipCode: profile.shipping_zip_code || "",
              country: profile.shipping_country || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.billing_first_name || profile.first_name || "",
              lastName: profile.billing_last_name || profile.last_name || "",
              address1: profile.billing_address || "",
              address2: profile.billing_address_2 || "",
              city: profile.billing_city || "",
              state: profile.billing_state || "",
              zipCode: profile.billing_zip_code || "",
              country: profile.billing_country || "US",
              countryName: "United States"
            },
            card: {
              holderName: `${profile.shipping_first_name || ""} ${profile.shipping_last_name || ""}`,
              number: profile.card_number || "",
              exp: `${profile.expiry_month || ""}/${profile.expiry_year || ""}`,
              cvv: profile.cvv || ""
            }
          };

        case "Swft AIO Format":
          return {
            id: "",
            firstName: profile["Shipping First Name"] || profile.firstName || "",
            lastName: profile["Shipping Last Name"] || profile.lastName || "",
            email: profile.Email || profile.email || "",
            phone: profile.Phone || profile.phone || "",
            shippingAddress: {
              firstName: profile["Shipping First Name"] || profile.firstName || "",
              lastName: profile["Shipping Last Name"] || profile.lastName || "",
              address1: profile["Shipping Address 1"] || "",
              address2: profile["Shipping Address 2"] || "",
              city: profile["Shipping City"] || "",
              state: profile["Shipping State"] || "",
              zipCode: profile["Shipping Zip Code"] || "",
              country: "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile["Billing First Name"] || profile.firstName || "",
              lastName: profile["Billing Last Name"] || profile.lastName || "",
              address1: profile["Billing Address 1"] || "",
              address2: profile["Billing Address 2"] || "",
              city: profile["Billing City"] || "",
              state: profile["Billing State"] || "",
              zipCode: profile["Billing Zip Code"] || "",
              country: "US",
              countryName: "United States"
            },
            card: {
              holderName: `${profile["Shipping First Name"] || ""} ${profile["Shipping Last Name"] || ""}`,
              number: profile["CC Number"] || "",
              exp: `${profile["CC Month"] || ""}/${profile["CC Year"] || ""}`,
              cvv: profile.CVV || profile.cvv || ""
            }
          };

        case "Shikari Format":
          return {
            id: "",
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            email: profile.email || "",
            phone: profile.phone_num || "",
            shippingAddress: {
              firstName: profile.first_name || "",
              lastName: profile.last_name || "",
              address1: profile.shipping_street || "",
              address2: profile.shipping_street_2 || "",
              city: profile.shipping_city || "",
              state: profile.shipping_state || "",
              zipCode: profile.shipping_zip_code || "",
              country: profile.shipping_country || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.billing_first_name || profile.first_name || "",
              lastName: profile.billing_last_name || profile.last_name || "",
              address1: profile.billing_street || "",
              address2: profile.billing_street_2 || "",
              city: profile.billing_city || "",
              state: profile.billing_state || "",
              zipCode: profile.billing_zip_code || "",
              country: profile.billing_country || "US",
              countryName: "United States"
            },
            card: {
              holderName: `${profile.first_name || ""} ${profile.last_name || ""}`,
              number: profile.cc_number || "",
              exp: `${profile.cc_exp_month || ""}/${profile.cc_exp_year || ""}`,
              cvv: profile.cc_cvv || ""
            }
          };

        case "Hayha Format":
          return {
            id: "",
            firstName: profile.shipping?.firstName || profile.firstName || "",
            lastName: profile.shipping?.lastName || profile.lastName || "",
            email: profile.shipping?.email || profile.email || "",
            phone: profile.shipping?.phone || profile.phone || "",
            shippingAddress: {
              firstName: profile.shipping?.firstName || profile.firstName || "",
              lastName: profile.shipping?.lastName || profile.lastName || "",
              address1: profile.shipping?.address || "",
              address2: profile.shipping?.address2 || "",
              city: profile.shipping?.city || "",
              state: profile.shipping?.state?.shortCode || profile.shipping?.state || "",
              zipCode: profile.shipping?.zipCode || "",
              country: profile.shipping?.country || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.billing?.firstName || profile.firstName || "",
              lastName: profile.billing?.lastName || profile.lastName || "",
              address1: profile.billing?.address || "",
              address2: profile.billing?.address2 || "",
              city: profile.billing?.city || "",
              state: profile.billing?.state?.shortCode || profile.billing?.state || "",
              zipCode: profile.billing?.zipCode || "",
              country: profile.billing?.country || "US",
              countryName: "United States"
            },
            card: {
              holderName: profile.cardInfo?.holder || profile.holder || "",
              number: profile.cardInfo?.cardNumber || profile.cardNumber || "",
              exp: `${profile.cardInfo?.expMonth || ""}/${String(profile.cardInfo?.expYear || "").slice(-2)}`,
              cvv: profile.cardInfo?.cvv || ""
            }
          };

        case "Hidden Format":
        case "Nexar Format":
          return {
            id: "",
            firstName: profile.billingFirstName || profile.firstName || "",
            lastName: profile.billingLastName || profile.lastName || "",
            email: profile.billingEmail || profile.email || "",
            phone: profile.billingPhone || profile.phone || "",
            shippingAddress: {
              firstName: profile.shippingFirstName || profile.firstName || "",
              lastName: profile.shippingLastName || profile.lastName || "",
              address1: profile.shippingLine1 || "",
              address2: profile.shippingLine2 || "",
              city: profile.shippingCity || "",
              state: profile.shippingState || "",
              zipCode: profile.shippingPostCode || "",
              country: profile.shippingCountry || "US",
              countryName: "United States"
            },
            billingAddress: {
              firstName: profile.billingFirstName || profile.firstName || "",
              lastName: profile.billingLastName || profile.lastName || "",
              address1: profile.billingLine1 || "",
              address2: profile.billingLine2 || "",
              city: profile.billingCity || "",
              state: profile.billingState || "",
              zipCode: profile.billingPostCode || "",
              country: profile.billingCountry || "US",
              countryName: "United States"
            },
            card: {
              holderName: `${profile.cardFirstName || ""} ${profile.cardLastName || ""}`,
              number: profile.cardNumber || "",
              exp: `${profile.cardExpMonth || ""}/${String(profile.cardExpYear || "").slice(-2)}`,
              cvv: profile.cardCvv || ""
            }
          };

        default:
          // Generic fallback for other formats

          return {
            id: "",
            firstName: profile.firstName || profile.first_name || profile.shipping?.firstName || "",
            lastName: profile.lastName || profile.last_name || profile.shipping?.lastName || "",
            email: profile.email || profile.shipping?.email || "",
            phone: profile.phone || profile.phoneNumber || profile.shipping?.phone || "",
            shippingAddress: {
              firstName: profile.shippingFirstName || profile.shipping_first_name || profile.shipping?.firstName || profile.firstName || profile.first_name || "",
              lastName: profile.shippingLastName || profile.shipping_last_name || profile.shipping?.lastName || profile.lastName || profile.last_name || "",
              address1: profile.shippingAddress1 || profile.shipping_address1 || profile.shipping?.addressLine1 || profile.address1 || profile.address || "",
              address2: profile.shippingAddress2 || profile.shipping_address2 || profile.shipping?.addressLine2 || profile.address2 || "",
              city: profile.shippingCity || profile.shipping_city || profile.shipping?.city || profile.city || "",
              state: profile.shippingState || profile.shipping_state || profile.shipping?.state || profile.state || "",
              zipCode: profile.shippingZipCode || profile.shipping_zipcode || profile.shipping?.zipCode || profile.zipCode || profile.zip || "",
              country: profile.shippingCountry || profile.shipping_country || profile.shipping?.countryCode || profile.country || "US",
              countryName: profile.shippingCountryName || profile.shipping_country_name || profile.shipping?.countryName || profile.countryName || "United States"
            },
            billingAddress: {
              firstName: profile.billingFirstName || profile.billing_first_name || profile.billing?.firstName || profile.firstName || profile.first_name || "",
              lastName: profile.billingLastName || profile.billing_last_name || profile.billing?.lastName || profile.lastName || profile.last_name || "",
              address1: profile.billingAddress1 || profile.billing_address1 || profile.billing?.addressLine1 || profile.address1 || profile.address || "",
              address2: profile.billingAddress2 || profile.billing_address2 || profile.billing?.addressLine2 || profile.address2 || "",
              city: profile.billingCity || profile.billing_city || profile.billing?.city || profile.city || "",
              state: profile.billingState || profile.billing_state || profile.billing?.state || profile.state || "",
              zipCode: profile.billingZipCode || profile.billing_zipcode || profile.billing?.zipCode || profile.zipCode || profile.zip || "",
              country: profile.billingCountry || profile.billing_country || profile.billing?.countryCode || profile.country || "US",
              countryName: profile.billingCountryName || profile.billing_country_name || profile.billing?.countryName || profile.countryName || "United States"
            },
            card: {
              holderName: profile.cardHolder || profile.card_holder || profile.holderName || profile.card?.holder || "",
              number: profile.cardNumber || profile.card_number || profile.number || profile.card?.number || "",
              exp: profile.cardExpiry || profile.card_expiry || profile.expiry || profile.exp || profile.card?.expiration || "",
              cvv: profile.cardCvv || profile.card_cvv || profile.cvv || profile.card?.cvv || ""
            }
          };
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const updateProfile = (profileId: string, updates: Partial<Profile>) => {
    setProfiles(profiles.map((profile) => (profile.id === profileId ? { ...profile, ...updates } : profile)))
  }

  const deleteProfile = (profileId: string) => {
    const newProfiles = profiles.filter((profile) => profile.id !== profileId)
    setProfiles(newProfiles)
  }

  const copyShippingToBilling = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId)
    if (profile) {
      updateProfile(profileId, {
        billingAddress: { ...profile.shippingAddress },
      })
    }
  }

  const validateEditAllFields = () => {
    let error = "";

    // Validate email if provided
    if (editAllFields.email && !validateEmail(editAllFields.email)) {
      error = "Invalid email format";
    }

    // Validate phone if provided
    if (editAllFields.phone) {
      const phoneDigits = editAllFields.phone.replace(/\D/g, '');
      if (!/^\d{10}$/.test(phoneDigits)) {
        error = "Phone number must be exactly 10 digits";
      }
    }

    // Validate card number if provided
    if (editAllFields.cardNumber) {
      const cardType = getCardType(editAllFields.cardNumber);
      const digits = editAllFields.cardNumber.replace(/\D/g, '');

      if (cardType === "amex" && !/^\d{15}$/.test(digits)) {
        error = "American Express card number must have 15 digits";
      } else if (cardType !== "amex" && cardType !== "unknown" && !/^\d{16}$/.test(digits)) {
        error = "Card number must have 16 digits";
      } else if (cardType === "unknown" && digits.length < 13) {
        error = "Card number must be at least 13 digits";
      }
    }

    // Validate card expiration if provided
    if (editAllFields.cardExp) {
      if (!/^\d{2}\/\d{2}$/.test(editAllFields.cardExp)) {
        error = "Card expiration must be in MM/YY format";
      } else {
        const [expMonth, expYear] = editAllFields.cardExp.split("/").map((v) => parseInt(v.trim(), 10));

        // Validate month range (1-12)
        if (expMonth < 1 || expMonth > 12) {
          error = "Month must be between 01 and 12";
        } else {
          // Create expiration date as end of month (e.g., 2025-08-31)
          const expiryDate = new Date(2000 + expYear, expMonth, 0); // last day of the month
          const currentDate = new Date();

          if (expiryDate < currentDate) {
            error = "Card has already expired";
          }
        }
      }
    }

    // Validate CVV if provided
    if (editAllFields.cardCvv) {
      const cardType = getCardType(editAllFields.cardNumber || '');
      const expectedCvvLength = cardType === "amex" ? 4 : 3;

      if (editAllFields.cardCvv.length !== expectedCvvLength) {
        error = `CVV must be ${expectedCvvLength} digits for ${cardType === "amex" ? "American Express" : "this card type"}`;
      } else if (!/^\d+$/.test(editAllFields.cardCvv)) {
        error = "CVV must contain only digits";
      }
    }

    // Validate shipping zip code if provided
    if (editAllFields.shippingZipCode) {
      if (editAllFields.shippingCountry === 'US' && !/^\d{5}(-\d{4})?$/.test(editAllFields.shippingZipCode)) {
        error = "US ZIP code must be 5 digits (plus optional 4 digits)";
      }
    }

    // Validate billing zip code if provided
    if (editAllFields.billingZipCode) {
      if (editAllFields.billingCountry === 'US' && !/^\d{5}(-\d{4})?$/.test(editAllFields.billingZipCode)) {
        error = "US ZIP code must be 5 digits (plus optional 4 digits)";
      }
    }

    if (error) {
      showToast({ message: error, type: "error" });
      return false;
    }
    return true;
  };

  const applyEditAll = () => {
    if (!validateEditAllFields()) {
      return;
    }

    const updates = Object.fromEntries(
      Object.entries(editAllFields).filter(([_, value]) => value.trim() !== '')
    );

    if (Object.keys(updates).length === 0) {
      showToast({ message: "No fields to update", type: "error" });
      return;
    }

    const updatedProfiles = profiles.map(profile => {
      const updatedProfile = { ...profile };

      // Update basic profile fields
      if (updates.firstName) updatedProfile.firstName = updates.firstName;
      if (updates.lastName) updatedProfile.lastName = updates.lastName;
      if (updates.email) updatedProfile.email = updates.email;
      if (updates.phone) updatedProfile.phone = updates.phone;

      // Update shipping address
      if (updates.shippingFirstName) updatedProfile.shippingAddress.firstName = updates.shippingFirstName;
      if (updates.shippingLastName) updatedProfile.shippingAddress.lastName = updates.shippingLastName;
      if (updates.shippingAddress1) updatedProfile.shippingAddress.address1 = updates.shippingAddress1;
      if (updates.shippingAddress2) updatedProfile.shippingAddress.address2 = updates.shippingAddress2;
      if (updates.shippingCity) updatedProfile.shippingAddress.city = updates.shippingCity;
      if (updates.shippingState) updatedProfile.shippingAddress.state = updates.shippingState;
      if (updates.shippingZipCode) updatedProfile.shippingAddress.zipCode = updates.shippingZipCode;
      if (updates.shippingCountry) {
        updatedProfile.shippingAddress.country = updates.shippingCountry;
        updatedProfile.shippingAddress.countryName = updates.shippingCountry;
      }

      // Update billing address
      if (updates.billingFirstName) updatedProfile.billingAddress.firstName = updates.billingFirstName;
      if (updates.billingLastName) updatedProfile.billingAddress.lastName = updates.billingLastName;
      if (updates.billingAddress1) updatedProfile.billingAddress.address1 = updates.billingAddress1;
      if (updates.billingAddress2) updatedProfile.billingAddress.address2 = updates.billingAddress2;
      if (updates.billingCity) updatedProfile.billingAddress.city = updates.billingCity;
      if (updates.billingState) updatedProfile.billingAddress.state = updates.billingState;
      if (updates.billingZipCode) updatedProfile.billingAddress.zipCode = updates.billingZipCode;
      if (updates.billingCountry) {
        updatedProfile.billingAddress.country = updates.billingCountry;
        updatedProfile.billingAddress.countryName = updates.billingCountry;
      }

      // Update card information
      if (updates.cardHolderName) updatedProfile.card.holderName = updates.cardHolderName;
      if (updates.cardNumber) updatedProfile.card.number = updates.cardNumber;
      if (updates.cardExp) updatedProfile.card.exp = updates.cardExp;
      if (updates.cardCvv) updatedProfile.card.cvv = updates.cardCvv;

      return updatedProfile;
    });

    setProfiles(updatedProfiles);
    setShowEditAllModal(false);
    showToast({
      message: `Updated ${Object.keys(updates).length} field(s) for all ${profiles.length} profiles`,
      type: "success"
    });
  };

  const resetEditAllFields = () => {
    setEditAllFields({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      shippingFirstName: '',
      shippingLastName: '',
      shippingAddress1: '',
      shippingAddress2: '',
      shippingCity: '',
      shippingState: '',
      shippingZipCode: '',
      shippingCountry: '',
      billingFirstName: '',
      billingLastName: '',
      billingAddress1: '',
      billingAddress2: '',
      billingCity: '',
      billingState: '',
      billingZipCode: '',
      billingCountry: '',
      cardHolderName: '',
      cardNumber: '',
      cardExp: '',
      cardCvv: ''
    });
  };

  const exportProfiles = async () => {
    if (!exportType) {
      showToast({ message: "Please select an export format", type: "error" })
      return
    }

    if (profiles.length === 0) {
      showToast({ message: "No profiles to export", type: "error" })
      return
    }

    // Generate a default group name if none is provided (for imported profiles)
    const exportGroupName = groupName.trim() || `Exported_${Date.now()}`;

    setIsGenerating(true)

    try {
      const cleanProfiles = profiles.map((p) => ({
        ...p,
        card: {
          ...p.card,
          number: p.card.number.replace(/-/g, ""),  // strip out all hyphens
        },
      }));

      // Country code to name mapping for Cyber Format
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

      const getCountryName = (code: string): string => {
        return countryCodeToName[code] || code;
      };

      let formattedForBot;
      if (exportType === "Cyber Format") {
        // For Cyber format, we need to create a single object with all profiles in one array
        const cyberProfiles = cleanProfiles.map((p, index) => {
          const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
          return {
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
              firstName: p.firstName,
              lastName: p.lastName,
              address1: p.shippingAddress.address1,
              address2: p.shippingAddress.address2 || "",
              zip: p.shippingAddress.zipCode,
              city: p.shippingAddress.city,
              country: getCountryName(p.shippingAddress.country),
              state: p.shippingAddress.state,
            },
            billing: {
              firstName: p.firstName,
              lastName: p.lastName,
              address1: p.billingAddress.address1,
              address2: p.billingAddress.address2 || "",
              zip: p.billingAddress.zipCode,
              city: p.billingAddress.city,
              country: getCountryName(p.billingAddress.country),
              state: p.billingAddress.state,
            }
          };
        });

        formattedForBot = [{
          id: Math.random().toString(36).substring(2, 10).toUpperCase(),
          name: exportGroupName,
          profiles: cyberProfiles
        }];
      } else if (exportType === "Valor Format") {
        // For Valor format, merge all profile objects into one object
        const valorProfiles = cleanProfiles.map((p, index) => {
          const uuid = uuidv4();
          return {
            [uuid]: {
              name: `${exportGroupName}_${index + 1}`,
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
                firstName: p.firstName,
                lastName: p.lastName,
                addressLine1: p.shippingAddress.address1,
                addressLine2: p.shippingAddress.address2 || "",
                city: p.shippingAddress.city,
                countryName: p.shippingAddress.countryName,
                countryCode: p.shippingAddress.country,
                state: p.shippingAddress.state,
                zipCode: p.shippingAddress.zipCode,
              },
              billing: {
                firstName: p.firstName,
                lastName: p.lastName,
                addressLine1: p.billingAddress.address1,
                addressLine2: p.billingAddress.address2 || "",
                city: p.billingAddress.city,
                countryName: p.billingAddress.countryName,
                countryCode: p.billingAddress.country,
                state: p.billingAddress.state,
                zipCode: p.billingAddress.zipCode,
              },
              id: uuid,
              totalSpent: 0,
            }
          };
        });

        // Merge all objects into one
        formattedForBot = valorProfiles.reduce((acc, profile) => ({ ...acc, ...profile }), {});
      } else {
        formattedForBot = formatProfilesForBot(exportGroupName, cleanProfiles, exportType);
      }
      const bot = botFormats[exportType];
      const baseFilename = bot ? bot.filename : `${exportType}`;
      const filename = `${exportGroupName}_${baseFilename}`;
      exportForBot(exportType, filename, formattedForBot);

      showToast({ message: `Exported ${profiles.length} profiles successfully!`, type: "success" })
    } catch (error) {


      showToast({ message: "Failed to export profiles", type: "error" })
    } finally {
      setIsGenerating(false)
    }
  }

  const validateCreation = (throwError: boolean) => {
    let error = null

    if (cardType === "manual") {

      if (!cardInfo.cvv.trim()) {
        error = "Enter CVV";
      } else if (cardInfo.cvv.length !== cvvLength) {
        error = `CVV must be ${cvvLength} digits`
      }

      if (!cardInfo.exp.trim()) {
        error = "Enter expiration date";
      } else {
        const [expMonth, expYear] = cardInfo.exp.split("/").map((v) => parseInt(v.trim(), 10));
        // Create expiration date as end of month (e.g., 2025-08-31)
        const expiryDate = new Date(2000 + expYear, expMonth, 0); // last day of the month
        const currentDate = new Date();

        if (expiryDate < currentDate) {
          error = "Card has already expired";
        }
      }
      if (!cardInfo.number.trim()) {
        error = "Enter card number";
      } else {
        if (getCardType(cardInfo.number) === "amex" && !/^\d{15}$/.test(cardInfo.number.replace(/\D/g, ''))) {
          error = "Card number must have 15 digits";
        } else if (getCardType(cardInfo.number) !== "amex" && !/^\d{16}$/.test(cardInfo.number.replace(/\D/g, ''))) {
          error = "Card number must have 16 digits";
        }
      }

      if (!cardInfo.holderName.trim()) {
        error = "Enter card holder name";
      }
    }

    if (cardType === "extend") {
      if (!vccCards || vccCards.length === 0) {
        error = "Please fetch Extend VCC details";
      }
    }

    if (cardType === "import") {
      const fileInput = cardFileRef.current;
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        error = "Please upload CSV file";
      }
    }

    // Validate shipping zip code
    if (!shippingAddress.zipCode.trim()) {
      error = "Shipping ZIP code is required";
    } else if (shippingAddress.country === 'US' && !/^\d{5}(-\d{4})?$/.test(shippingAddress.zipCode)) {
      error = "US ZIP code must be 5 digits (plus optional 4 digits)";
    }

    // Validate billing zip code if not using same as shipping
    if (!useSameAsShipping) {
      if (!billingAddress.zipCode.trim()) {
        error = "Billing ZIP code is required";
      } else if (billingAddress.country === 'US' && !/^\d{5}(-\d{4})?$/.test(billingAddress.zipCode)) {
        error = "US ZIP code must be 5 digits (plus optional 4 digits)";
      }
    }

    // For US addresses, require city and state
    if (shippingAddress.country === 'US' && (!shippingAddress.city.trim() || !shippingAddress.state.trim())) {
      error = "City and state are required for US addresses";
    }
    if (!useSameAsShipping && billingAddress.country === 'US' && (!billingAddress.city.trim() || !billingAddress.state.trim())) {
      error = "City and state are required for US addresses";
    }

    if (!shippingOptions.randomAddress1 && !shippingAddress.address1.trim()) {
      error = "Shipping address line 1 is required"
    }

    if (!shippingOptions.randomLastName && shippingAddress.lastName.trim() === "") {
      error = "Shipping last name is required"
    }

    if (!shippingOptions.randomFirstName && shippingAddress.firstName.trim() === "") {
      error = "Shipping first name is required"
    }

    // Validate billing names if not using same as shipping
    if (!useSameAsShipping) {
      if (!billingOptions.randomLastName && billingAddress.lastName.trim() === "") {
        error = "Billing last name is required"
      }

      if (!billingOptions.randomFirstName && billingAddress.firstName.trim() === "") {
        error = "Billing first name is required"
      }
    }

    if (phoneType === "areaCode" && !/^\d{3}$/.test(phoneValue)) {
      error = "Area code must be exactly 3 digits"
    } else if (phoneType === "areaCode" && parseInt(phoneValue, 10) > 989 || parseInt(phoneValue, 10) < 201) {
      error = "Area code must be between 201 and 989"
    }

    if (phoneType === "single" && !/^\d{10}$/.test(phoneValue)) {
      error = "Phone number must be exactly 10 digits"
    }

    if (phoneType !== "random" && !phoneValue.trim()) {
      error = "Phone value is required for selected phone type"
    }

    const fileInput = emailFileRef.current;
    if (emailType === "import" && (!fileInput || !fileInput.files || fileInput.files.length === 0)) {
      error = "File uploaded required for email import"
    }

    if (emailType === "catchall" && !validateDomain(emailValue.replace(/^@/, ""))) {
      error = "Invalid domain for catchall"
    }

    if (emailType === "single" && !validateEmail(emailValue)) {
      error = "Invalid email format"
    }

    if ((emailType === "single" || emailType === "catchall") && !emailValue.trim()) {
      error = "Email value is required for selected email type"
    }

    if (profileCount <= 0) {
      error = "Profile count must be at least 1"
    }

    if (!profileCount) {
      error = "Profile count required";
    }

    if (!groupName.trim()) {
      error = "Group name is required"
    }

    if (error) {
      if (throwError) showToast({ message: error, type: "error" })
      return true
    }
    return false
  }

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("create");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-100">
      <header
        className={`sticky top-0 z-50 border-b border-gray-200 backdrop-blur-sm transition-all duration-300 ${isScrolled
          ? "bg-white shadow-md translate-y-0"
          : "bg-white/90 shadow-sm translate-y-0"
          }`}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">The Profile Builder</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-gray-300 text-gray-700 text-base hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Profile Builder</h1>
            <p className="text-gray-600 text-lg">Create and customize individual checkout bot profiles</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-12">
            <TabsList className="grid w-full grid-cols-2 mb-12 p-1">
              <TabsTrigger
                value="create"
                className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-blue-700 data-[state=inactive]:hover:bg-blue-100 transition-all duration-300 rounded-lg py-4 px-8 text-lg font-semibold cursor-pointer h-14"
              >
                <Plus className="w-5 h-5" />
                <span>Create Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="import"
                className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-blue-700 data-[state=inactive]:hover:bg-blue-100 transition-all duration-300 rounded-lg py-4 px-8 text-lg font-semibold cursor-pointer h-14"
              >
                <Upload className="w-5 h-5" />
                <span>Import Profiles</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              {/* Basic Information */}
              <Card className="bg-white border-gray-200 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center">
                    <FileUser className="w-5 h-5 mr-2 text-blue-500" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="groupName" className="text-gray-700 text-base">
                        Group Name
                      </Label>
                      <Input
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="My Profiles"
                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="profileCount" className="text-gray-700 text-base">
                        Profile Count
                      </Label>
                      <Input
                        id="profileCount"
                        type="number"
                        onWheelCapture={e => {
                          e.currentTarget.blur()
                        }}
                        min="1"
                        value={profileCount}
                        onChange={(e) => {
                          setProfileCount(Number.parseInt(e.target.value))
                        }}
                        className="bg-white border-gray-300 text-gray-800"
                      />
                    </div>
                  </div>

                  {/* Email Type Selector */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <LabeledSelect
                        className="flex flex-col space-y-2"
                        label="Email Type"
                        value={emailType}
                        onChange={(e) => {

                          if (e !== "import") {
                            setImportedEmails([])
                            // Don't reset profileCount when changing email type
                          }

                          setFields(new Map([
                            [setEmailType, e],
                            [setEmailValue, ""]
                          ]))
                        }
                        }
                        placeholder="Select type"
                        options={[
                          { value: "single", label: "Single" },
                          { value: "catchall", label: "Catchall" },
                          { value: "random", label: "Random" },
                          { value: "import", label: "Import" },
                        ]}
                      />
                    </div>

                    {(emailType !== "random") && (emailType !== "import") && (
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="emailValue" className="text-gray-700 text-base">
                          {emailType === "catchall" ? "Domain" : "Email"}
                        </Label>
                        <Input
                          id="emailValue"
                          type={emailType === "single" ? 'email' : 'string'}
                          value={emailValue}
                          onChange={(e) => setEmailValue(e.target.value)}
                          placeholder={emailType === "single" ? "example@example.com" : "example.com"}
                          className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                        />
                      </div>
                    )}

                    {emailType === "import" && (
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="emailFile" className="text-gray-700 text-base">
                          Import Emails
                        </Label>
                        <Input
                          id="emailFile"
                          type="file"
                          accept=".txt,.csv"
                          onChange={handleEmailFileUpload}
                          ref={emailFileRef}
                          className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Phone Type Selector */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <LabeledSelect
                        className="flex flex-col space-y-2"
                        label="Phone Type"
                        value={phoneType}
                        onChange={(e) =>
                          setFields(new Map([
                            [setPhoneType, e],
                            [setPhoneValue, ""]
                          ]))}
                        placeholder="Select type"
                        options={[
                          { value: "single", label: "Single" },
                          { value: "areaCode", label: "Area Code" },
                          { value: "random", label: "Random" },
                        ]}
                      />
                    </div>

                    {(phoneType !== "random") && (
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="phoneValue" className="text-gray-700 text-base">
                          {phoneType === "areaCode" ? "Area Code" : "Phone Number"}
                        </Label>
                        <Input
                          id="phoneValue"
                          value={phoneValue}
                          type="tel"
                          maxLength={phoneType === "areaCode" ? 3 : 10}
                          onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, ""))}
                          placeholder={phoneType === "areaCode" ? "XXX" : "(XXX) XXX-XXXX"}
                          className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="bg-white border-gray-200 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center">
                    <MapPinHouse className="w-5 h-5 mr-2 text-blue-500" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="firstName" className="text-gray-700 text-base">
                          First Name
                        </Label>
                        <Input
                          placeholder="First Name"
                          value={shippingAddress.firstName}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              "firstName": e.target.value,
                            })
                          }
                          disabled={shippingOptions.randomFirstName}
                          className="bg-white border-gray-300 text-gray-800 text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="randomName"
                          checked={shippingOptions.randomFirstName}
                          onCheckedChange={(val) => {
                            setShippingOptions({ ...shippingOptions, randomFirstName: Boolean(val) })
                            if (val) {
                              setShippingAddress({ ...shippingAddress, firstName: "" })
                            }
                          }}
                        />
                        <Label htmlFor="first-name" className="text-gray-700 ">
                          Random First Name
                        </Label>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="lastName" className="text-gray-700 text-base">
                          Last Name
                        </Label>
                        <Input
                          placeholder="Last Name"
                          value={shippingAddress.lastName}
                          onChange={(e) => {
                            setShippingAddress({ ...shippingAddress, "lastName": e.target.value })
                          }
                          }
                          className="bg-white border-gray-300 text-gray-800 text-sm"
                          disabled={shippingOptions.randomLastName}
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="randomLastName"
                          checked={shippingOptions.randomLastName}
                          onCheckedChange={(val) => {
                            setShippingOptions({ ...shippingOptions, randomLastName: Boolean(val) })
                            if (val) {
                              setShippingAddress({ ...shippingAddress, lastName: "" })
                            }
                          }}
                        />
                        <Label htmlFor="last-name" className="text-gray-700 ">
                          Random Last Name
                        </Label>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="emailFile" className="text-gray-700 text-base">
                          Address Line 1
                        </Label>
                        <Input
                          placeholder="Address Line 1"
                          value={shippingAddress.address1}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              "address1": e.target.value,
                            })
                          }
                          className="bg-white border-gray-300 text-gray-800 text-sm"
                        />
                      </div>
                      <div className="flex">
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox
                            id="randomPrefix"
                            checked={shippingOptions.randomPrefix}
                            onCheckedChange={(val) => { setShippingOptions({ ...shippingOptions, randomPrefix: Boolean(val) }), setBillingOptions({ ...billingOptions, randomPrefix: Boolean(val) }) }}
                          />
                          <Label htmlFor="random prefix" className="text-gray-700">
                            Random Prefix
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 ml-8">
                          <Checkbox
                            id="randomAddress1"
                            checked={shippingOptions.randomAddress1}
                            onCheckedChange={(val) => setShippingOptions({ ...shippingOptions, randomAddress1: Boolean(val) })}
                          />
                          <Label htmlFor="ai-generated" className="text-gray-700">
                            AI Generated
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="address2" className="text-gray-700 text-base">
                        Address Line 2
                      </Label>
                      <Input
                        id="address2"
                        placeholder="Address Line 2"
                        value={shippingAddress.address2}
                        disabled={shippingOptions.randomAddress2}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            "address2": e.target.value,
                          })
                        }
                        className="bg-white border-gray-300 text-gray-800 text-sm"
                      />
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="randomAddress2"
                          checked={shippingOptions.randomAddress2}
                          // disabled={shippingAddress.address2.length > 0 ? true : false}
                          onCheckedChange={(val) => {
                            setShippingOptions({ ...shippingOptions, randomAddress2: Boolean(val) })
                            setShippingAddress({ ...shippingAddress, address2: "" })
                          }}
                        />
                        <Label htmlFor="random-address" className="text-gray-700">
                          Random Address 2
                        </Label>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="country" className="text-gray-700 text-base">
                          Country
                        </Label>
                        <CountryPicker
                          value={shippingAddress.country}
                          onChange={(code, name) => {
                            setShippingAddress((prev) => ({
                              ...prev,
                              country: code,
                              countryName: name,
                              zipCode: "", // Clear zip code when country changes
                              city: "", // Clear city as it's tied to zip code
                              state: "", // Clear state as it's tied to zip code
                            }));
                            // If using same as shipping, update billing address too
                            if (useSameAsShipping) {
                              setBillingAddress((prev) => ({
                                ...prev,
                                country: code,
                                countryName: name,
                                zipCode: "",
                                city: "",
                                state: "",
                              }));
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="zipCode" className="text-gray-700 text-base">
                          Zip Code
                        </Label>
                        <Input
                          id="zipCodeShipping"
                          placeholder="12345"
                          value={shippingAddress.zipCode}
                          onChange={(e) => {
                            // Allow letters, numbers, spaces and hyphens, max 10 chars
                            const cleaned = e.target.value.replace(/[^a-zA-Z0-9 -]/g, "").slice(0, 10);
                            setShippingAddress((prev) => ({
                              ...prev,
                              zipCode: cleaned,
                            }))
                          }}
                          className="bg-white border-gray-300 text-gray-800 text-sm h-9"
                          type="text"
                          inputMode="text"
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="shippingState" className="text-gray-700 text-base">
                          State
                        </Label>
                        <Input
                          className="bg-white border-gray-300 text-gray-800 text-sm"
                          id="shippingState"
                          value={shippingAddress.state}
                          onChange={(e) => {
                            setShippingAddress((prev) => ({
                              ...prev,
                              state: e.target.value
                            }));
                            if (useSameAsShipping) {
                              setBillingAddress((prev) => ({
                                ...prev,
                                state: e.target.value
                              }));
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="shippingCity" className="text-gray-700 text-base">
                          City
                        </Label>
                        <Input
                          className="bg-white border-gray-300 text-gray-800 text-sm"
                          id="shippingCity"
                          value={shippingAddress.city}
                          onChange={(e) => {
                            setShippingAddress((prev) => ({
                              ...prev,
                              city: e.target.value
                            }));
                            if (useSameAsShipping) {
                              setBillingAddress((prev) => ({
                                ...prev,
                                city: e.target.value
                              }));
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card className="bg-white border-gray-200 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center">
                    <NotebookTabs className="w-5 h-5 mr-2 text-blue-500" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2 w-full">
                      <div className="flex items-center">
                        <Checkbox
                          id="same-as-shipping"
                          checked={useSameAsShipping}
                          onCheckedChange={(val) => {
                            setUseSameAsShipping(Boolean(val))
                            if (!val) {
                              setBillingAddress({
                                firstName: "",
                                lastName: "",
                                address1: "",
                                address2: "",
                                zipCode: "",
                                city: "",
                                state: "",
                                country: "US",
                                countryName: "United States",
                              })
                              setBillingOptions({
                                randomAddress1: false,
                                randomFirstName: false,
                                randomLastName: false,
                                randomAddress2: false,
                                randomPrefix: false,
                              })
                            } else {
                              // Copy shipping address to billing address
                              setBillingAddress({
                                ...shippingAddress,
                                firstName: shippingAddress.firstName,
                                lastName: shippingAddress.lastName,
                              })
                              setBillingOptions({
                                ...shippingOptions,
                                randomFirstName: shippingOptions.randomFirstName,
                                randomLastName: shippingOptions.randomLastName,
                              })
                            }
                          }}
                        />
                      </div>
                      <div className="text-gray-700 text-base w-full">
                        Use same as shipping address
                      </div>
                    </div>
                    <div className="mb-4">
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="billingFirstName" className="text-gray-700 text-base">
                          First Name
                        </Label>
                        <Input
                          placeholder="First Name"
                          value={billingAddress.firstName}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              "firstName": e.target.value,
                            })
                          }
                          disabled={useSameAsShipping || billingOptions.randomFirstName}
                          className="bg-white border-gray-300 text-gray-800 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="billingRandomFirstName"
                          checked={billingOptions.randomFirstName}
                          disabled={useSameAsShipping}
                          onCheckedChange={(val) => {
                            setBillingOptions({ ...billingOptions, randomFirstName: Boolean(val) })
                            if (val) {
                              setBillingAddress({ ...billingAddress, firstName: "" })
                            }
                          }}
                        />
                        <Label htmlFor="billing-random-first-name" className="text-gray-700">
                          Random First Name
                        </Label>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="billingLastName" className="text-gray-700 text-base">
                          Last Name
                        </Label>
                        <Input
                          placeholder="Last Name"
                          value={billingAddress.lastName}
                          onChange={(e) => {
                            setBillingAddress({ ...billingAddress, "lastName": e.target.value })
                          }
                          }
                          className="bg-white border-gray-300 text-gray-800 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                          disabled={useSameAsShipping || billingOptions.randomLastName}
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="billingRandomLastName"
                          checked={billingOptions.randomLastName}
                          disabled={useSameAsShipping}
                          onCheckedChange={(val) => {
                            setBillingOptions({ ...billingOptions, randomLastName: Boolean(val) })
                            if (val) {
                              setBillingAddress({ ...billingAddress, lastName: "" })
                            }
                          }}
                        />
                        <Label htmlFor="billing-random-last-name" className="text-gray-700">
                          Random Last Name
                        </Label>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="billingAddress1" className="text-gray-700 text-base">Address Line 1</Label>
                      <Input
                        id="billingAddress1"
                        placeholder="Address Line 1"
                        disabled={useSameAsShipping}
                        value={billingAddress.address1}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, address1: e.target.value })
                        }
                        className="bg-white border-gray-300 text-gray-800 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="billingAddress2" className="text-gray-700 text-base">Address Line 2</Label>
                      <Input
                        id="billingAddress2"
                        placeholder="Address Line 2"
                        disabled={useSameAsShipping}
                        value={billingAddress.address2}
                        onChange={(e) =>
                          setBillingAddress({ ...billingAddress, address2: e.target.value })
                        }
                        className="bg-white border-gray-300 text-gray-800 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="billingCountry" className="text-gray-700 text-base">
                          Country
                        </Label>
                        <CountryPicker
                          disabled={useSameAsShipping}
                          value={billingAddress.country}
                          onChange={(code, name) => {
                            if (!useSameAsShipping) {
                              setBillingAddress((prev) => ({
                                ...prev,
                                country: code,
                                countryName: name,
                                zipCode: "", // Clear zip code when country changes
                                city: "", // Clear city as it's tied to zip code
                                state: "", // Clear state as it's tied to zip code
                              }));
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="billingZip" className="text-gray-700 text-base">
                          Zip Code
                        </Label>
                        <Input
                          id="zipCodeBilling"
                          placeholder="12345"
                          value={billingAddress.zipCode}
                          disabled={useSameAsShipping}
                          onChange={(e) => {
                            // Allow letters, numbers, spaces and hyphens, max 10 chars
                            const cleaned = e.target.value.replace(/[^a-zA-Z0-9 -]/g, "").slice(0, 10);
                            if (!useSameAsShipping) {
                              setBillingAddress((prev) => ({
                                ...prev,
                                zipCode: cleaned,
                              }))
                            }
                          }}
                          className="bg-white border-gray-300 text-gray-800 text-sm h-9 disabled:bg-gray-100 disabled:text-gray-500"
                          type="text"
                          inputMode="text"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="billingState" className="text-gray-700 text-base">State</Label>
                        <Input
                          id="billingState"
                          value={billingAddress.state}
                          disabled={useSameAsShipping}
                          onChange={(e) => {
                            if (!useSameAsShipping) {
                              setBillingAddress((prev) => ({
                                ...prev,
                                state: e.target.value
                              }));
                            }
                          }}
                          className="bg-white border-gray-300 text-gray-800 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="billingCity" className="text-gray-700 text-base">City</Label>
                        <Input
                          id="billingCity"
                          value={billingAddress.city}
                          disabled={useSameAsShipping}
                          onChange={(e) => {
                            if (!useSameAsShipping) {
                              setBillingAddress((prev) => ({
                                ...prev,
                                city: e.target.value
                              }));
                            }
                          }}
                          className="bg-white border-gray-300 text-gray-800 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card Information */}
              <Card className="bg-white border-gray-200 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                    Card Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cardType === "extend" && vccCards.length > 0 && (
                      <div className="border border-green-300 bg-green-50 px-4 py-2 rounded-md">
                        <p className="text-green-700 text-sm font-medium">
                          ✅ You have imported {vccCards.length} Extend VCC cards
                        </p>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="w-full">
                        <LabeledSelect
                          className="flex flex-col space-y-2"
                          label="Card Type"
                          value={cardType}
                          onChange={(e) => {
                            if (e === 'extend') {
                              setImportedCards([])
                              setShowVCCManager(true)
                            }
                            if (e !== "import") {
                              setImportedCards([])
                            }
                            setCardType(e)
                          }}
                          placeholder="Select type"
                          options={[
                            { value: "manual", label: "Manual" },
                            { value: "import", label: "Import CSV" },
                            { value: "extend", label: "Extend VCC" },
                            {
                              value: "slash",
                              label: "Slash VCC",
                              endLabel: " (Coming soon)",
                              disabled: true
                            },
                            {
                              value: "privacy",
                              label: "Privacy VCC",
                              endLabel: " (Coming soon)",
                              disabled: true
                            }
                          ]}
                        />
                      </div>
                      {cardType === "extend" && vccCards.length > 0 && (
                        <div className="flex items-end gap-2 w-full">
                          <Button
                            variant="outline"
                            onClick={() => {
                              // Country code mapping
                              const countryPhoneCodes: { [key: string]: string } = {
                                'US': '+1',
                                'GB': '+44',
                                'CA': '+1',
                                'AU': '+61',
                                'DE': '+49',
                                'FR': '+33',
                                'IT': '+39',
                                'ES': '+34',
                                'NL': '+31',
                                'BE': '+32',
                                'CH': '+41',
                                'AT': '+43',
                                'SE': '+46',
                                'NO': '+47',
                                'DK': '+45',
                                'FI': '+358',
                                'IE': '+353',
                                'NZ': '+64',
                                'JP': '+81',
                                'CN': '+86',
                                'IN': '+91',
                                'BR': '+55',
                                'MX': '+52',
                                'AR': '+54',
                                'CL': '+56',
                                'CO': '+57',
                                'PE': '+51',
                                'VE': '+58',
                                'ZA': '+27',
                                'RU': '+7',
                                'TR': '+90',
                                'IL': '+972',
                                'AE': '+971',
                                'SA': '+966',
                                'SG': '+65',
                                'MY': '+60',
                                'TH': '+66',
                                'VN': '+84',
                                'PH': '+63',
                                'ID': '+62',
                                'PK': '+92',
                                'BD': '+880',
                                'LK': '+94',
                                'NP': '+977',
                                'MM': '+95',
                                'KH': '+855',
                                'LA': '+856',
                                'BN': '+673',
                                'TL': '+670',
                                'KR': '+82',
                                'HK': '+852',
                                'TW': '+886',
                                'MO': '+853',
                                'KZ': '+7',
                                'UZ': '+998',
                                'KG': '+996',
                                'TJ': '+992',
                                'TM': '+993',
                                'MN': '+976',
                                'BT': '+975',
                                'MV': '+960',
                                'AF': '+93',
                                'IQ': '+964',
                                'IR': '+98',
                                'SY': '+963',
                                'JO': '+962',
                                'LB': '+961',
                                'KW': '+965',
                                'BH': '+973',
                                'QA': '+974',
                                'OM': '+968',
                                'YE': '+967',
                                'PS': '+970',
                                'EG': '+20',
                                'LY': '+218',
                                'TN': '+216',
                                'DZ': '+213',
                                'MA': '+212',
                                'MR': '+222',
                                'ML': '+223',
                                'GN': '+224',
                                'CI': '+225',
                                'BF': '+226',
                                'NE': '+227',
                                'TG': '+228',
                                'BJ': '+229',
                                'MU': '+230',
                                'LR': '+231',
                                'SL': '+232',
                                'GH': '+233',
                                'NG': '+234',
                                'TD': '+235',
                                'CF': '+236',
                                'CM': '+237',
                                'CV': '+238',
                                'ST': '+239',
                                'GQ': '+240',
                                'GA': '+241',
                                'CG': '+242',
                                'CD': '+243',
                                'AO': '+244',
                                'GW': '+245',
                                'IO': '+246',
                                'SC': '+248',
                                'SD': '+249',
                                'RW': '+250',
                                'ET': '+251',
                                'SO': '+252',
                                'DJ': '+253',
                                'KE': '+254',
                                'TZ': '+255',
                                'UG': '+256',
                                'BI': '+257',
                                'MZ': '+258',
                                'ZM': '+260',
                                'MG': '+261',
                                'RE': '+262',
                                'ZW': '+263',
                                'NA': '+264',
                                'MW': '+265',
                                'LS': '+266',
                                'BW': '+267',
                                'SZ': '+268',
                                'KM': '+269',
                                'SH': '+290',
                                'ER': '+291',
                                'AW': '+297',
                                'FO': '+298',
                                'GL': '+299'
                              };

                              const csvContent = vccCards.map(card =>
                                `${card.holderName},${card.number},${card.exp},${card.cvv}`
                              ).join('\n');
                              const csv = `Card Holder,Card Number,Expiry,CVV\n${csvContent}`;
                              const blob = new Blob([csv], { type: 'text/csv' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'extend_vcc_cards.csv';
                              a.click();
                              window.URL.revokeObjectURL(url);
                            }}
                            className="flex-1 h-10 group border-gray-300 text-gray-700 hover:text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                          >
                            <Download className="w-4 h-4 mr-2 text-blue-600 group-hover:text-blue-600" />
                            Download Cards
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              // Reset VCC cards and Extend state
                              setVccCards([]);
                              setShowVCCManager(false);
                              setShouldResetVCC(true);
                              // Delete Extend access token cookie
                              document.cookie = "extend_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            }}
                            className="flex-1 h-10 group border-gray-300 text-gray-700 hover:text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4 mr-2 text-red-600 group-hover:text-red-600" />
                            Reset
                          </Button>
                        </div>
                      )}

                      {cardType === "import" && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="downloadTemplate" className="text-gray-700 text-base">Card Template</Label>
                            <Button
                              type="button"
                              id="downloadTemplate"
                              onClick={() => {
                                const csvContent = "data:text/csv;charset=utf-8,Card Holder Name,Card Number,Exp Month,Exp Year,CVV\n";
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", "card_template.csv");
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              variant="outline"
                              className="w-full md:w-auto border-gray-300 text-gray-700 text-sm hover:bg-gray-50 hover:border-gray-400"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download File
                            </Button>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="cardFile" className="text-gray-700 text-base">
                              Import Cards
                            </Label>
                            <Input
                              id="cardFile"
                              type="file"
                              accept=".csv"
                              onChange={handleCardFileUpload}
                              ref={cardFileRef}
                              className="bg-white border-gray-300 text-gray-800"
                            />
                          </div>
                        </div>
                      )}

                      {cardType === "manual" && (
                        <div className="w-full flex flex-col space-y-2">
                          <Label htmlFor="holderName" className="text-gray-700 text-base">Card holder name</Label>
                          <Input
                            placeholder="XXXX XXXXX"
                            value={cardInfo.holderName}
                            onChange={(e) => {
                              setCardInfo({
                                ...cardInfo,
                                holderName: e.target.value,
                              });
                            }}
                            className="bg-white border-gray-300 text-gray-800 text-sm w-full"
                            id="holderName"
                            type="text"
                          />
                        </div>
                      )}



                    </div>

                    <div className="grid gap-4 md:grid-cols-2">

                      {cardType === "manual" && (
                        <div className="w-full flex flex-col space-y-2">
                          <Label htmlFor="cardNumber" className="text-gray-700 text-base">Card Number</Label>
                          <div className="relative">
                            <Input
                              placeholder="XXXX-XXXX-XXXX-XXXX"
                              value={cardInfo.number}
                              onChange={(e) => {
                                let digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                                const cardType = getCardType(digits); // Use unformatted number for detection

                                let formatted = "";
                                if (cardType === "amex") {
                                  // Amex format: 4-6-5
                                  formatted = digits
                                    .replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, g1, g2, g3) => {
                                      return [g1, g2, g3].filter(Boolean).join("-");
                                    });
                                  setCvvLength(4);
                                } else {
                                  // Default format: 4-4-4-4
                                  formatted = digits
                                    .replace(/(\d{4})(?=\d)/g, "$1-")
                                    .slice(0, 19);
                                  setCvvLength(3);
                                }

                                setCardInfo({
                                  ...cardInfo,
                                  number: formatted,
                                });
                              }}
                              className="bg-white border-gray-300 text-gray-800 text-sm w-full pr-10"
                              id="cardNumber"
                              type="text"
                              inputMode="numeric"
                              maxLength={19}
                            />

                            {/* Show image only if card type is known */}
                            {getCardType(cardInfo.number) !== "unknown" && (
                              <img
                                src={cardTypeImages[getCardType(cardInfo.number)]}
                                alt="Card Type"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-8 object-contain"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {cardType === "manual" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="exp" className="text-gray-700 text-base">Expiration</Label>
                            <Input
                              id="exp"
                              placeholder="MM/YY"
                              value={cardInfo.exp}
                              onChange={(e) => {
                                let value = e.target.value;

                                // Remove all non-digit and slash
                                value = value.replace(/[^\d/]/g, "");

                                // If typing without slash, auto-insert after 2 digits
                                if (/^\d{2}$/.test(value)) {
                                  value = value + "/";
                                }

                                // Prevent more than 5 characters (MM/YY)
                                if (value.length > 5) return;

                                // Validate month part
                                const [month] = value.split("/");
                                if (month && parseInt(month) > 12) return;

                                setCardInfo({
                                  ...cardInfo,
                                  exp: value,
                                });
                              }}
                              className="bg-white border-gray-300 text-gray-800 text-sm w-full"
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                            />
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Label htmlFor="cvv" className="text-gray-700 text-base">CVV</Label>
                            <Input
                              placeholder="CVV"
                              id="cvv"
                              value={cardInfo.cvv}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, ""); // remove non-digits
                                if (value.length <= cvvLength) {
                                  setCardInfo({
                                    ...cardInfo,
                                    cvv: value,
                                  });
                                }
                              }}
                              className="bg-white border-gray-300 text-gray-800 text-sm w-full"
                              type="text"
                              inputMode="numeric"
                              maxLength={cvvLength}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Profiles Button - without card */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 py-8">
                <Button
                  variant={'outline'}
                  size={'lg'}
                  onClick={() => {
                    // Reset basic information
                    setGroupName("");
                    setProfileCount(1);
                    setEmailType("single");
                    setEmailValue("");
                    setPhoneType("single");
                    setPhoneValue("");

                    // Reset shipping options
                    setShippingOptions({
                      randomFirstName: false,
                      randomLastName: false,
                      randomPrefix: false,
                      randomAddress1: false,
                      randomAddress2: false,
                    });

                    // Reset billing options
                    setBillingOptions({
                      randomFirstName: false,
                      randomLastName: false,
                      randomPrefix: false,
                      randomAddress1: false,
                      randomAddress2: false,
                    });

                    // Reset same as shipping checkbox
                    setUseSameAsShipping(true);

                    // Reset shipping address
                    setShippingAddress({
                      firstName: "",
                      lastName: "",
                      address1: "",
                      address2: "",
                      zipCode: "",
                      city: "",
                      state: "",
                      country: "US",
                      countryName: "United States",
                    });
                    setBillingAddress({
                      firstName: "",
                      lastName: "",
                      address1: "",
                      address2: "",
                      zipCode: "",
                      city: "",
                      state: "",
                      country: "US",
                      countryName: "United States",
                    });
                    setCardInfo({
                      holderName: "",
                      number: "",
                      exp: "",
                      cvv: "",
                    });
                    setCardType("manual");
                    setImportedCards([]);
                    setImportedEmails([]);
                    // Reset VCC cards and Extend state
                    setVccCards([]);
                    setShouldResetVCC(true);
                    // Delete Extend access token cookie
                    document.cookie = "extend_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  }}
                  className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 px-8 py-3 text-base transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                >
                  Clear Form
                </Button>
                <Button
                  type="button"
                  onClick={generateProfiles}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-in-out"
                  size="lg"
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Generate Profiles
                </Button>
                <AiJigModal
                  endpoint="https://us-central1-xbot-2b603.cloudfunctions.net/jig"
                  quantity={profileCount} address={shippingAddress.address1}
                  isOpen={show}
                  onClose={async (jigs) => {
                    setShow(false)
                    if (jigs) {
                      setGeneratedAddress(jigs)
                      await createProfiles(jigs)
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-6 my-8">
              {/* Import Profiles */}
              <Card className="bg-white border-gray-200 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-blue-500" />
                    Import Profiles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Import Format and File Field in same line */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-2">
                      <Label className="text-gray-700 text-base">Import Format</Label>
                      <Select value={importFormat} onValueChange={setImportFormat}>
                        <SelectTrigger className="bg-white border-gray-300 text-gray-800">
                          <SelectValue placeholder="Select import format" />
                        </SelectTrigger>
                        <SelectContent className="max-h-none">
                          {Object.keys(botFormats).sort().map((key) =>
                            <SelectItem key={key} value={key}>{botFormats[key].label}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="importFile" className="text-gray-700 text-base">Profile File</Label>
                      <Input
                        id="importFile"
                        type="file"
                        accept=".csv,.json,.hayha,.Hayha"
                        onChange={handleImportFileUpload}
                        className="bg-white border-gray-300 text-gray-800"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImportFile(null);
                        setImportFormat("");
                        const fileInput = document.getElementById('importFile') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="flex-1 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                    >
                      Reset Import
                    </Button>
                    <Button
                      onClick={handleImportProfiles}
                      disabled={!importFile || !importFormat || isImporting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md shadow-md hover:shadow-lg transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <FileUser className="w-4 h-4 mr-2" />
                          Import Profiles
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Profiles ({profiles.length})</h2>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  disabled={profiles.length === 0}
                  variant="outline"
                  onClick={() => setShowEditAllModal(true)}
                  className="group border-gray-300 text-gray-700 hover:text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200">
                  <FileUser className="w-4 h-4 text-blue-600" />
                  Edit All
                </Button>
                <Button
                  size="sm"
                  disabled={profiles.length === 0}
                  variant="outline"
                  onClick={() => {
                    setProfiles([]);
                    setCurrentPage(1);
                    setEditingProfile(null);
                  }}
                  className="group border-gray-300 text-gray-700 hover:text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-colors duration-200">
                  <Trash2 className="w-4 h-4 text-red-600" />
                  Delete profiles
                </Button>
              </div>
            </div>

            <div>
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex flex-col space-y-4">
                    {paginatedProfiles.map((profile, index) => (
                      <ProfileCard
                        key={profile.id}
                        profile={profile}
                        index={index}
                        currentPage={currentPage}
                        pageCount={itemsPerPage}
                        isEditing={editingProfile === profile.id}
                        onEdit={() => setEditingProfile(profile.id)}
                        onSave={() => setEditingProfile(null)}
                        onCancel={() => setEditingProfile(null)}
                        onUpdate={(updates) => updateProfile(profile.id, updates)}
                        onDelete={() => deleteProfile(profile.id)}
                        onCopyShippingToBilling={() => copyShippingToBilling(profile.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center py-6 mb-6">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="default"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm hover:-translate-y-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Previous
                  </Button>

                  <span className="text-gray-700 text-base font-medium px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="default"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm hover:-translate-y-0.5"
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          </div>



          {/* Export profiles */}
          <Card className="bg-white border-gray-200 shadow-sm mb-6 transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <Download className="w-5 h-5 mr-2 text-blue-500" />
                  Export Profiles
                </div>
                {profiles.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {profiles.length} profile{profiles.length !== 1 ? 's' : ''} ready
                    </span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label className="text-gray-700 text-base">Export Format</Label>
                  <Select value={exportType} onValueChange={setExportType}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-800">
                      <SelectValue placeholder="Select bot format" />
                    </SelectTrigger>
                    <SelectContent className="max-h-none">
                      {Object.keys(botFormats).sort().map((key) =>
                        <SelectItem key={key} value={key}>{botFormats[key].label}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={exportProfiles}
                    disabled={isGenerating || profiles.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 text-lg rounded-md shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Profiles
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Modal
            footer={null}
            open={showVCCManager}
            onCancel={() => {
              setShowVCCManager(false)
            }}
            maskClosable={false}
            styles={modalStyles}
          >
            <ExtendVCCManager
              onProfilesBuilt={handleProfilesBuilt}
              shouldReset={shouldResetVCC}
              profileCount={profileCount}
              existingCards={vccCards}
              onClose={() => {
                setShouldResetVCC(false);
                setShowVCCManager(false)
              }}
              onModalClose={() => {
                setShouldResetVCC(false);
                setShowVCCManager(false)
              }} />
          </Modal>
        </motion.div>
      </div>

      <PoweredBy />

      {/* Edit All Modal */}
      <Modal
        title="Edit All Profiles"
        open={showEditAllModal}
        onCancel={() => {
          setShowEditAllModal(false);
          resetEditAllFields();
        }}
        footer={null}
        width={800}
        className="edit-all-modal"
      >
        <div className="space-y-6">
          <p className="text-gray-600 mb-4">
            Edit fields for all {profiles.length} profiles. Leave fields empty to keep current values.
          </p>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="card">Card</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mass-firstName">First Name</Label>
                  <Input
                    id="mass-firstName"
                    value={editAllFields.firstName}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-lastName">Last Name</Label>
                  <Input
                    id="mass-lastName"
                    value={editAllFields.lastName}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-email">Email</Label>
                  <Input
                    id="mass-email"
                    type="email"
                    value={editAllFields.email}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-phone">Phone</Label>
                  <Input
                    id="mass-phone"
                    value={editAllFields.phone}
                    onChange={(e) => {
                      // Restrict to 10 digits only
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEditAllFields(prev => ({ ...prev, phone: digits }));
                    }}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shipping" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mass-shippingFirstName">First Name</Label>
                  <Input
                    id="mass-shippingFirstName"
                    value={editAllFields.shippingFirstName}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, shippingFirstName: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-shippingLastName">Last Name</Label>
                  <Input
                    id="mass-shippingLastName"
                    value={editAllFields.shippingLastName}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, shippingLastName: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="mass-shippingAddress1">Address Line 1</Label>
                  <Input
                    id="mass-shippingAddress1"
                    value={editAllFields.shippingAddress1}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, shippingAddress1: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="mass-shippingAddress2">Address Line 2</Label>
                  <Input
                    id="mass-shippingAddress2"
                    value={editAllFields.shippingAddress2}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, shippingAddress2: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-shippingCity">City</Label>
                  <Input
                    id="mass-shippingCity"
                    value={editAllFields.shippingCity}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, shippingCity: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-shippingState">State</Label>
                  <Input
                    id="mass-shippingState"
                    value={editAllFields.shippingState}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, shippingState: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-shippingCountry">Country</Label>
                  <CountryPicker
                    value={editAllFields.shippingCountry}
                    onChange={(code, name) => {
                      setEditAllFields(prev => ({ ...prev, shippingCountry: code }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="mass-shippingZipCode">Zip Code</Label>
                  <Input
                    id="mass-shippingZipCode"
                    value={editAllFields.shippingZipCode}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      // Format US zip codes: 12345 or 12345-6789
                      if (editAllFields.shippingCountry === 'US' && value.length > 5) {
                        value = value.slice(0, 5) + '-' + value.slice(5, 9);
                      }
                      setEditAllFields(prev => ({ ...prev, shippingZipCode: value }));
                    }}
                    placeholder={editAllFields.shippingCountry === 'US' ? "12345 or 12345-6789" : "Leave empty to keep current"}
                    className="bg-white border-gray-300 text-gray-800"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mass-billingFirstName">First Name</Label>
                  <Input
                    id="mass-billingFirstName"
                    value={editAllFields.billingFirstName}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, billingFirstName: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-billingLastName">Last Name</Label>
                  <Input
                    id="mass-billingLastName"
                    value={editAllFields.billingLastName}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, billingLastName: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="mass-billingAddress1">Address Line 1</Label>
                  <Input
                    id="mass-billingAddress1"
                    value={editAllFields.billingAddress1}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, billingAddress1: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="mass-billingAddress2">Address Line 2</Label>
                  <Input
                    id="mass-billingAddress2"
                    value={editAllFields.billingAddress2}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, billingAddress2: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-billingCity">City</Label>
                  <Input
                    id="mass-billingCity"
                    value={editAllFields.billingCity}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, billingCity: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-billingState">State</Label>
                  <Input
                    id="mass-billingState"
                    value={editAllFields.billingState}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, billingState: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-billingCountry">Country</Label>
                  <CountryPicker
                    value={editAllFields.billingCountry}
                    onChange={(code, name) => {
                      setEditAllFields(prev => ({ ...prev, billingCountry: code }));
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="mass-billingZipCode">Zip Code</Label>
                  <Input
                    id="mass-billingZipCode"
                    value={editAllFields.billingZipCode}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      // Format US zip codes: 12345 or 12345-6789
                      if (editAllFields.billingCountry === 'US' && value.length > 5) {
                        value = value.slice(0, 5) + '-' + value.slice(5, 9);
                      }
                      setEditAllFields(prev => ({ ...prev, billingZipCode: value }));
                    }}
                    placeholder={editAllFields.billingCountry === 'US' ? "12345 or 12345-6789" : "Leave empty to keep current"}
                    className="bg-white border-gray-300 text-gray-800"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="card" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mass-cardHolderName">Card Holder Name</Label>
                  <Input
                    id="mass-cardHolderName"
                    value={editAllFields.cardHolderName}
                    onChange={(e) => setEditAllFields(prev => ({ ...prev, cardHolderName: e.target.value }))}
                    placeholder="Leave empty to keep current"
                    className="bg-white border-gray-300 text-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="mass-cardNumber">Card Number</Label>
                  <div className="relative">
                    <Input
                      id="mass-cardNumber"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      value={editAllFields.cardNumber}
                      onChange={(e) => {
                        let digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                        const cardType = getCardType(digits);

                        let formatted = "";
                        if (cardType === "amex") {
                          // Amex format: 4-6-5
                          formatted = digits
                            .replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_, g1, g2, g3) => {
                              return [g1, g2, g3].filter(Boolean).join("-");
                            });
                        } else {
                          // Default format: 4-4-4-4
                          formatted = digits
                            .replace(/(\d{4})(?=\d)/g, "$1-")
                            .slice(0, 19);
                        }

                        setEditAllFields(prev => ({ ...prev, cardNumber: formatted }));
                      }}
                      className="bg-white border-gray-300 text-gray-800 text-sm w-full pr-10"
                      type="text"
                      inputMode="numeric"
                      maxLength={19}
                    />

                    {/* Show card type image */}
                    {getCardType(editAllFields.cardNumber) !== "unknown" && (
                      <img
                        src={cardTypeImages[getCardType(editAllFields.cardNumber)]}
                        alt="Card Type"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-8 object-contain"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="mass-cardExp">Expiration (MM/YY)</Label>
                  <Input
                    id="mass-cardExp"
                    value={editAllFields.cardExp}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2);
                      }
                      setEditAllFields(prev => ({ ...prev, cardExp: value }));
                    }}
                    placeholder="MM/YY"
                    className="bg-white border-gray-300 text-gray-800"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="mass-cardCvv">CVV</Label>
                  <Input
                    id="mass-cardCvv"
                    value={editAllFields.cardCvv}
                    onChange={(e) => {
                      const cardType = getCardType(editAllFields.cardNumber || '');
                      const maxLength = cardType === "amex" ? 4 : 3;
                      const digits = e.target.value.replace(/\D/g, '').slice(0, maxLength);
                      setEditAllFields(prev => ({ ...prev, cardCvv: digits }));
                    }}
                    placeholder={getCardType(editAllFields.cardNumber || '') === "amex" ? "4 digits" : "3 digits"}
                    className="bg-white border-gray-300 text-gray-800"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditAllModal(false);
                resetEditAllFields();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={applyEditAll}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Apply to All Profiles
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
