"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, CreditCard, Mail, Eye, EyeOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { UserCreditCard } from "../types/profile"
import { showToast } from "../builder/helper"
import { faker } from "@faker-js/faker"

// Cookie utilities
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

const getCookie = (name: string): string | null => {
  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) {
      const token = c.substring(nameEQ.length, c.length)

      // Decode the JWT payload
      try {
        const payloadBase64 = token.split(".")[1]
        const payloadJson = atob(payloadBase64)
        const payload = JSON.parse(payloadJson)

        // Check if expired
        const currentTime = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < currentTime) {
          console.warn("Token has expired")
          return null
        }

        return token
      } catch (e) {
        console.error("Invalid token format", e)
        return null
      }
    }
  }
  return null
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

export default function ExtendVCCManager({ onProfilesBuilt, onClose, shouldReset = false, profileCount, onModalClose, existingCards }: { onProfilesBuilt: (data: any) => void, onClose: () => void, shouldReset?: boolean, profileCount?: number, onModalClose?: () => void, existingCards?: UserCreditCard[] }) {
  const [mode, setMode] = useState<"existing" | "new">("existing")
  const [stage, setStage] = useState<"mode" | "creating" | "credentials" | "otp" | "fetching" | "done" | "source-selection" | "csv-upload" | "imported" | "existing-source-selection" | "existing-fetching">("mode")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  interface SourceCard {
    id: string;
    displayName: string;
    companyName: string;
    user: {
      email: string;
    };
  }

  const [sourceCards, setSourceCards] = useState<SourceCard[]>([])
  const [selectedSourceCard, setSelectedSourceCard] = useState<string>("")
  const [selectedSourceCards, setSelectedSourceCards] = useState<string[]>([])
  const [limit, setLimit] = useState<string>("$100")
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"Daily" | "Weekly" | "Monthly">("Daily")
  const [genCount, setGenCount] = useState<string | number>(1)
  const [weeklyResetDay, setWeeklyResetDay] = useState<string>("")
  const [monthlyResetDay, setMonthlyResetDay] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [importedCards, setImportedCards] = useState<UserCreditCard[] | null>(null)
  const [isLoginProcessActive, setIsLoginProcessActive] = useState(false)
  const [otpError, setOTPError] = useState<string>("")

  // Existing VCC specific state
  const [existingVCCProgress, setExistingVCCProgress] = useState(0)
  const [existingVCCTotal, setExistingVCCTotal] = useState(0)
  const [existingVCCCurrent, setExistingVCCCurrent] = useState(0)
  const [existingVCCMaxProgress, setExistingVCCMaxProgress] = useState(0) // Track max progress value
  const [filteredExistingVCCs, setFilteredExistingVCCs] = useState<UserCreditCard[]>([])
  const [isFetchingVCCs, setIsFetchingVCCs] = useState(false) // Track if VCC fetching is in progress
  const [abortController, setAbortController] = useState<AbortController | null>(null) // For cancelling API calls

  // Add new state variables for bulk creation progress
  const [bulkCreationProgress, setBulkCreationProgress] = useState(0)
  const [bulkCreationTotal, setBulkCreationTotal] = useState(0)
  const [bulkCreationCurrent, setBulkCreationCurrent] = useState(0)
  const [bulkCreationStage, setBulkCreationStage] = useState<'creating' | 'sleeping' | 'fetching'>('creating')
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState(0)


  const parseExp = (isoString: string): string => {
    const date = new Date(isoString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
  }

  const transformCardData = (card: any): UserCreditCard => {
    return {
      holderName: `${card.cardholder.firstName} ${card.cardholder.lastName}`,
      number: card.vcn,
      exp: parseExp(card.expires),
      cvv: card.securityCode,
    }
  }

  async function getExtendVcn(cardId: string): Promise<UserCreditCard | null> {
    try {
      const res = await fetch(`https://v.paywithextend.com/virtualcards/${cardId}`, {
        method: "GET",
        headers: {
          "accept": "application/vnd.paywithextend.v2021-03-12+json",
          "authorization": `Bearer ${accessToken}`,
          "x-extend-app-id": "app.paywithextend.com",
          "x-extend-brand": "br_2F0trP1UmE59x1ZkNIAqsg",
          "x-extend-platform": "web",
          "x-extend-platform-version": navigator.userAgent,
        },
      });

      if (!res.ok) {
        console.error("Extend API error:", res.status, await res.text());
        return null;
      }

      const data = await res.json();

      const virtualCard = data.virtualCard;
      if (!virtualCard.vcn || !virtualCard.expires || !virtualCard.securityCode || !virtualCard.cardholder.firstName || !virtualCard.cardholder.lastName) {
        console.error("Incomplete card data:", virtualCard);
        return null;
      }

      return transformCardData(virtualCard);
    } catch (err) {
      console.error("Error fetching Extend VCN:", err);
      return null;
    }
  }

  // Check for existing access token on component mount
  useEffect(() => {
    const savedToken = getCookie("extend_access_token")
    if (savedToken) {
      setAccessToken(savedToken)
    }
  }, [])

  // Reset modal state when shouldReset is true
  useEffect(() => {
    if (shouldReset) {
      // Reset all modal state
      setMode("existing")
      setStage("mode")
      setEmail("")
      setPassword("")
      setOtp("")
      setError(null)
      setIsLoading(false)
      setSourceCards([])
      setSelectedSourceCard("")
      setSelectedSourceCards([])
      setLimit("$100")
      setRecurrenceFrequency("Daily")
      setGenCount(1)
      setWeeklyResetDay("")
      setMonthlyResetDay("")
      setShowPassword(false)
      setImportedCards(null)
      setIsLoginProcessActive(false)
      setOTPError("")
      setExistingVCCProgress(0)
      setExistingVCCTotal(0)
      setExistingVCCCurrent(0)
      setExistingVCCMaxProgress(0)
      setFilteredExistingVCCs([])
      setIsFetchingVCCs(false)
      setAbortController(null)
      setBulkCreationProgress(0)
      setBulkCreationTotal(0)
      setBulkCreationCurrent(0)
      setBulkCreationStage('creating')
      setSleepTimeRemaining(0)
    }
  }, [shouldReset])

  // Check if we have existing cards and show them instead of mode selection
  useEffect(() => {
    if (existingCards && existingCards.length > 0) {
      setImportedCards(existingCards)
      setStage("imported")
    }
  }, [existingCards])

  const fetchSourceCards = async (token: string, targetStage: "source-selection" | "existing-source-selection" = "source-selection") => {
    try {
      setIsLoading(true)
      setError(null)

      const url = "https://api.paywithextend.com/creditcards"
      const headers = {
        Accept: "application/vnd.paywithextend.v2021-03-12+json",
        Authorization: `Bearer ${token}`,
        "X-Extend-Brand": "br_2F0trP1UmE59x1ZkNIAqsg",
        "X-Extend-App-ID": "app.paywithextend.com",
        "X-Extend-Platform": "web",
      }

      const params = new URLSearchParams({
        count: "500",
        page: "0",
        sortField: "userPendingActiveFirst",
        statuses: "ACTIVE",
        type: "SOURCE",
      })

      const response = await fetch(`${url}?${params.toString()}`, { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch source cards")
      }

      const data = await response.json()
      const cards = data.creditCards || []

      setSourceCards(
        cards.map((card: any) => ({
          id: card.id,
          displayName: card.displayName,
          companyName: card.companyName,
          user: card.user,
        })),
      )

      setStage(targetStage as any)
    } catch (err) {
      console.error("Fetch source cards error", err)
      setError("Failed to fetch source cards. Please try logging in again.")
      // Clear invalid token
      deleteCookie("extend_access_token")
      setAccessToken(null)
      setStage("credentials")
    } finally {
      setIsLoading(false)
    }
  }

  const getYesterday = (): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    return days[yesterday.getDay()]
  }

  const getDayIn29Days = (): number => {
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(today.getDate() + 29)
    return futureDate.getDate()
  }

  const generateRandomBoundary = (length: number): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const createBulkVirtualCards = async () => {
    if (!selectedSourceCard || !accessToken) return;

    // Create cards as per user request (genCount), fetch based on max of profile count and created cards
    const genCountNum = Number(genCount);
    const profileCountNum = profileCount || 0;
    const fetchCount = Math.min(Math.max(profileCountNum, genCountNum), 500);

    try {
      setIsLoading(true);
      setError(null);
      setBulkCreationProgress(0);
      setBulkCreationCurrent(0);
      setBulkCreationStage('creating');
      setBulkCreationTotal(genCountNum);

      // Calculate number of batches needed (50 cards per batch)
      const batchSize = 50;
      const numberOfBatches = Math.ceil(genCountNum / batchSize);

      // Create cards in batches
      for (let batchIndex = 0; batchIndex < numberOfBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, genCountNum);
        const cardsInThisBatch = endIndex - startIndex;

        // Generate CSV content for this batch
        let csvText = `Card Type,en-US,Virtual Card User Email,Card Name,Credit Limit,Reset Period,"Reset Period Interval (Number of days, weeks, or months between resets)",Reset End Type,Reset Count,Reset Until Date (MM/DD/YYYY),Weekly Reset Day,Monthly Reset Day,Notes\n`;

        for (let i = 0; i < cardsInThisBatch; i++) {
          const firstName = faker.person.firstName();
          const lastName = faker.person.lastName();
          const name = `${firstName} ${lastName}`;

          const weeklyDay = recurrenceFrequency === "Weekly" ? (weeklyResetDay || getYesterday()) : "";
          const monthlyDay = recurrenceFrequency === "Monthly" ? monthlyResetDay || getDayIn29Days().toString() : "";

          const sourceCard = sourceCards.find(e => e.id === selectedSourceCard);
          if (!sourceCard) throw new Error("Selected source card not found");
          const numericLimit = parseInt(limit.replace(/[^\d]/g, ''));
          const row = `Refill,en-US,${sourceCard.user.email},${name},${numericLimit},${recurrenceFrequency},1,Does not end,,,${weeklyDay},${monthlyDay},\n`;
          csvText += row;
        }

        // Create file-like object
        const file = new Blob([csvText], { type: "text/csv" });
        const formData = new FormData();
        formData.append("file", file, "virtual_cards.csv");

        const headers = {
          Accept: "application/vnd.paywithextend.v2021-03-12+json",
          Authorization: `Bearer ${accessToken}`,
          "X-Extend-Brand": "br_2F0trP1UmE59x1ZkNIAqsg",
          "X-Extend-App-ID": "app.paywithextend.com",
          "X-Extend-Platform": "web",
        };

        const response = await fetch(
          `https://api.paywithextend.com/creditcards/${selectedSourceCard}/bulkvirtualcardpush`,
          {
            method: "POST",
            headers,
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to create virtual cards batch ${batchIndex + 1}`);
        }

        // Update progress for this batch
        const cardsCreatedSoFar = endIndex;
        setBulkCreationCurrent(cardsCreatedSoFar);
        setBulkCreationProgress((cardsCreatedSoFar / genCountNum) * 100);

        // Add a small delay between batches to avoid rate limiting
        if (batchIndex < numberOfBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Start sleep period
      setBulkCreationStage('sleeping');
      const sleepDuration = 60000; // 60 seconds (50-70 seconds as requested)
      setSleepTimeRemaining(sleepDuration / 1000);

      // Sleep for 60 seconds with countdown
      for (let i = sleepDuration; i > 0; i -= 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSleepTimeRemaining(Math.ceil(i / 1000));
      }

      // Start fetching cards using the existing VCC workflow
      setBulkCreationStage('fetching');
      // Use the calculated fetchCount value for fetching
      await fetchExistingVCCs(accessToken, [selectedSourceCard], fetchCount);

      onClose?.();
    } catch (err) {
      console.error("Create bulk virtual cards error", err);

      // Show warning toast about creation failure
      showToast({
        message: "Card Creation Failed",
        description: "Extend has rejected the card creation. Please check with them. Proceeding to fetch existing cards...",
        type: "error",
      });

      // Skip timer and proceed directly to fetching cards
      setBulkCreationStage('fetching');
      // Use the calculated fetchCount value for fetching
      await fetchExistingVCCs(accessToken, [selectedSourceCard], fetchCount);

      onClose?.();
    } finally {
      setIsLoading(false);
      setBulkCreationProgress(0);
      setBulkCreationCurrent(0);
      setBulkCreationStage('creating');
      setSleepTimeRemaining(0);
    }
  };


  const fetchCards = async (token: string, count: number = 50) => {
    try {
      setIsLoading(true)
      setError(null)

      const url = "https://api.paywithextend.com/virtualcards"
      const headers = {
        Accept: "application/vnd.paywithextend.v2021-03-12+json",
        Authorization: `Bearer ${token}`,
        "X-Extend-Brand": "br_2F0trP1UmE59x1ZkNIAqsg",
        "X-Extend-App-ID": "app.paywithextend.com",
        "X-Extend-Platform": "web",
      }

      const params = new URLSearchParams({
        count: count.toString(),
        page: "1",
        statuses: "ACTIVE",
        type: "SOURCE",
      })

      const response = await fetch(`${url}?${params.toString()}`, { headers })

      if (!response.ok) {
        throw new Error("Failed to fetch cards")
      }

      const data = await response.json()
      const creditCards = data.virtualCards || []
      const formattedCards: UserCreditCard[] = await Promise.all(
        creditCards.map(async (card: any) => {
          return await getExtendVcn(card.id);
        })
      );
      setImportedCards(formattedCards)
      onProfilesBuilt(formattedCards)

      showToast({
        message: "Cards Retrieved Successfully",
        description: `${formattedCards.length} virtual credit card${formattedCards.length !== 1 ? "s" : ""} processed.`,
        type: "success",
      });
      onClose();
      setStage("done")
    } catch (err) {
      console.error("Fetch cards error", err)
      setError("Failed to fetch cards. Please try logging in again.")
      // Clear invalid token
      deleteCookie("extend_access_token")
      setAccessToken(null)
      setStage("credentials")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = () => {
    if (mode === "new") {
      // Check if we have a saved access token
      if (accessToken) {
        setStage("fetching")
        fetchSourceCards(accessToken)
      } else {
        setStage("credentials")
      }
      return
    }

    // Check if we have a saved access token for existing cards
    if (accessToken) {
      setStage("fetching")
      fetchSourceCards(accessToken, "existing-source-selection")
    } else {
      setStage("credentials")
    }
  }

  const fetchVCCsForSingleSource = async (
    token: string,
    sourceCardId: string,
    controller: AbortController,
    targetCount: number,
    onProgress: (processed: number, maxProgress: number) => void,
  ): Promise<UserCreditCard[]> => {
    let allVCCs: UserCreditCard[] = []
    let page = 0
    let hasMorePages = true
    let totalProcessed = 0
    let totalAvailableVCCs = 0
    let maxProgressValue = targetCount
    let isFirstPage = true

    while (hasMorePages) {
      try {
        const url = "https://api.paywithextend.com/virtualcards"
        const headers = {
          Accept: "application/vnd.paywithextend.v2021-03-12+json",
          Authorization: `Bearer ${token}`,
          "X-Extend-Brand": "br_2F0trP1UmE59x1ZkNIAqsg",
          "X-Extend-App-ID": "app.paywithextend.com",
          "X-Extend-Platform": "web",
        }

        const params = new URLSearchParams({
          count: "50",
          page: page.toString(),
          statuses: "ACTIVE",
          type: "SOURCE",
          creditCardId: sourceCardId,
        })

        const response = await fetch(`${url}?${params.toString()}`, {
          headers,
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch VCCs on page ${page}`)
        }

        const data = await response.json()
        const virtualCards = data.virtualCards || []

        if (isFirstPage) {
          totalAvailableVCCs = data.pagination?.totalItems || 0

          if (targetCount !== Infinity) {
            maxProgressValue = totalAvailableVCCs > 0
              ? Math.min(targetCount, totalAvailableVCCs)
              : targetCount
          } else {
            maxProgressValue = totalAvailableVCCs
          }

          onProgress(0, maxProgressValue)
          isFirstPage = false

          if (!data.pagination?.totalItems) {
            console.warn("No totalItems in API response pagination, falling back to dynamic counting")
          }
        }

        if (virtualCards.length === 0) {
          hasMorePages = false
          break
        }

        const detailedCards = await Promise.all(
          virtualCards.map(async (card: any) => {
            return await getExtendVcn(card.id)
          }),
        )

        const validCards = detailedCards.filter((card): card is UserCreditCard => card !== null)

        if (!data.pagination?.totalItems) {
          totalAvailableVCCs += validCards.length
          if (targetCount === Infinity) {
            maxProgressValue = totalAvailableVCCs
          }
        }

        if (maxProgressValue > 0) {
          const remainingNeeded = maxProgressValue - allVCCs.length
          const cardsToAdd = remainingNeeded > 0 ? validCards.slice(0, remainingNeeded) : []
          allVCCs = [...allVCCs, ...cardsToAdd]
          totalProcessed += cardsToAdd.length
        } else {
          allVCCs = [...allVCCs, ...validCards]
          totalProcessed += validCards.length
        }

        onProgress(totalProcessed, maxProgressValue)

        if (maxProgressValue > 0 && allVCCs.length >= maxProgressValue) {
          hasMorePages = false
          break
        }

        await new Promise(resolve => setTimeout(resolve, 100))
        page++
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        page++
      }
    }

    return allVCCs
  }

  // Function to fetch existing VCCs with pagination and filtering across multiple source cards
  const fetchExistingVCCs = async (token: string, sourceCardIds: string[], profileCount?: number) => {
    if (isLoading || isFetchingVCCs) {
      return
    }

    const controller = new AbortController()
    setAbortController(controller)

    try {
      setIsLoading(true)
      setIsFetchingVCCs(true)
      setError(null)
      setExistingVCCCurrent(0)
      setExistingVCCProgress(0)
      setExistingVCCMaxProgress(0)
      setFilteredExistingVCCs([])

      let allVCCs: UserCreditCard[] = []
      const targetCount = (profileCount && profileCount > 0) ? profileCount : Infinity
      let globalProcessed = 0
      let globalMaxProgress = 0

      setExistingVCCProgress(0)

      for (let i = 0; i < sourceCardIds.length; i++) {
        const sourceCardId = sourceCardIds[i]
        const remainingNeeded = targetCount === Infinity ? Infinity : targetCount - allVCCs.length

        if (remainingNeeded <= 0) break

        const cardsFromSource = await fetchVCCsForSingleSource(
          token,
          sourceCardId,
          controller,
          remainingNeeded,
          (processed, maxProgress) => {
            const currentGlobalProcessed = globalProcessed + processed
            const currentGlobalMax = globalMaxProgress + maxProgress
            setExistingVCCCurrent(currentGlobalProcessed)
            setExistingVCCMaxProgress(currentGlobalMax)
            if (currentGlobalMax > 0) {
              setExistingVCCProgress(Math.min((currentGlobalProcessed / currentGlobalMax) * 100, 100))
            }
            setExistingVCCTotal(currentGlobalProcessed)
          },
        )

        globalProcessed += cardsFromSource.length
        globalMaxProgress += cardsFromSource.length
        allVCCs = [...allVCCs, ...cardsFromSource]

        setExistingVCCCurrent(globalProcessed)
        setExistingVCCMaxProgress(globalMaxProgress)
        if (globalMaxProgress > 0) {
          setExistingVCCProgress(Math.min((globalProcessed / globalMaxProgress) * 100, 100))
        }

        if (targetCount !== Infinity && allVCCs.length >= targetCount) {
          allVCCs = allVCCs.slice(0, targetCount)
          break
        }
      }

      setFilteredExistingVCCs(allVCCs)
      setImportedCards(allVCCs)
      onProfilesBuilt(allVCCs)

      onClose?.()
    } catch (err) {
      console.error("Fetch existing VCCs error", err)

      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      if (err instanceof Error && err.message.includes('401')) {
        setError("Authentication failed. Please log in again.")
        deleteCookie("extend_access_token")
        setAccessToken(null)
        setStage("credentials")
      } else {
        setError("Failed to fetch existing VCCs. Please try again.")
        setStage("existing-source-selection")
      }
    } finally {
      setIsLoading(false)
      setIsFetchingVCCs(false)
      setAbortController(null)
    }
  }

  const clearExtendLoginCredentials = () => {
    setEmail("")
    setPassword("")
    setOtp("")
    setOTPError("")
    setStage("credentials")
    setIsLoginProcessActive(false)
  }

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null
    if (isLoginProcessActive && stage === "credentials") {
      timeout = setTimeout(() => {
        setStage("otp")
      }, 6000)
    }

    return () => {
      clearTimeout(timeout as NodeJS.Timeout)
    }
  }, [isLoginProcessActive, stage])

  const handleLogin = async () => {
    try {
      setError(null)
      setOTPError("")
      setOtp("")
      setIsLoginProcessActive(true)
      setIsLoading(false)

      const response = await fetch("/api/authtask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 401) {
        const { error } = await response.json();
        setError(error || "Login failed. Please try again.");
        clearExtendLoginCredentials()
        setIsLoading(false)
        return;
      }

      const data = await response.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        setCookie("extend_access_token", data.access_token, 7); // Save for 7 days
        setIsLoginProcessActive(false)
        setStage("fetching");
      } else {
        if (typeof data.error === "string" && data.error.includes("OTP")) {
          setOTPError(data.error);
          setIsLoginProcessActive(false)
          setIsLoading(false)
          setStage("credentials")
        } else {
          throw new Error(data.error);
        }
      }

    } catch (err) {
      console.error("Login error", err)
      setError("Login failed. Please check your credentials.")
      clearExtendLoginCredentials()
      setIsLoading(false)
      setIsLoginProcessActive(false)
    } finally {
      setIsLoginProcessActive(false)
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async () => {
    try {
      setIsLoading(true)
      setOTPError("")
      const response = await fetch("https://us-central1-xbot-2b603.cloudfunctions.net/saveOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (response.status === 402) {
        const { error } = await response.json();
        setOTPError(error || "OTP verification failed. Please try again.");
        setStage("credentials")
        return;
      }

    } catch (err) {
      console.error("OTP submit error", err)
      setOTPError("OTP verification failed. Please try again.")
    }
  }

  useEffect(() => {
    if (stage === "fetching" && accessToken && mode == "existing") {
      fetchSourceCards(accessToken, "existing-source-selection")
      return
    }
    if (stage === "fetching" && accessToken && mode == "new") {
      fetchSourceCards(accessToken, "source-selection")
    }
    if (stage === "existing-fetching" && accessToken && selectedSourceCards.length > 0 && !isFetchingVCCs) {
      setIsFetchingVCCs(true)
      fetchExistingVCCs(accessToken, selectedSourceCards, profileCount)
    }
  }, [accessToken, stage, selectedSourceCards])

  const handleClearAndRestart = () => {
    // Clear all local state
    deleteCookie("extend_access_token")
    setAccessToken(null)
    setEmail("")
    setPassword("")
    setOtp("")
    setError(null)
    setImportedCards(null)
    setStage("mode")

    // Clear existing VCC state
    setExistingVCCProgress(0)
    setExistingVCCTotal(0)
    setExistingVCCCurrent(0)
    setExistingVCCMaxProgress(0)
    setFilteredExistingVCCs([])
    setIsFetchingVCCs(false)
    setAbortController(null)

    // Clear bulk creation state
    setBulkCreationProgress(0)
    setBulkCreationTotal(0)
    setBulkCreationCurrent(0)
    setBulkCreationStage('creating')
    setSleepTimeRemaining(0)

    // Notify parent to clear cards
    onProfilesBuilt([])
    onClose?.()
  }

  const handleModalClose = () => {
    // Abort any ongoing API calls
    if (abortController) {
      abortController.abort()
    }

    // Clear VCC-related state but keep auth token
    setExistingVCCProgress(0)
    setExistingVCCTotal(0)
    setExistingVCCCurrent(0)
    setExistingVCCMaxProgress(0)
    setFilteredExistingVCCs([])
    setIsFetchingVCCs(false)
    setImportedCards(null)
    setError(null)
    setStage("mode")

    // Notify parent to clear cards
    onProfilesBuilt([])
    onClose?.()

    // Call parent's modal close handler if provided
    onModalClose?.()
  }

  // Removed the stage change to "imported" since we're closing the modal directly

  // Set default weekly reset day when Weekly is selected
  useEffect(() => {
    if (recurrenceFrequency === "Weekly" && !weeklyResetDay) {
      setWeeklyResetDay(getYesterday())
    }
  }, [recurrenceFrequency, weeklyResetDay])

  // Handle reset from parent
  useEffect(() => {
    if (shouldReset) {
      deleteCookie("extend_access_token")
      setAccessToken(null)
      setEmail("")
      setPassword("")
      setOtp("")
      setError(null)
      setImportedCards(null)
      setStage("mode")

      // Clear existing VCC state
      setExistingVCCProgress(0)
      setExistingVCCTotal(0)
      setExistingVCCCurrent(0)
      setExistingVCCMaxProgress(0)
      setFilteredExistingVCCs([])
      setIsFetchingVCCs(false)
      setAbortController(null)
    }
  }, [shouldReset])

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Abort any ongoing API calls when component unmounts
      if (abortController) {
        abortController.abort()
      }
    }
  }, []) // Empty dependency array - only run on unmount


  if (stage === "mode") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Extend VCC Manager
          </h2>
          <p className="text-gray-600">Choose how you want to manage your virtual credit cards</p>
        </div>
        <div className="space-y-6">
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as "existing" | "new")}>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="existing" id="existing" className="border-gray-300 text-blue-600" />
              <Label htmlFor="existing" className="flex-1 cursor-pointer text-gray-700">
                Use Existing VCC
                <p className="text-sm text-gray-500">Access your current virtual credit cards</p>
              </Label>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="new" id="new" className="border-gray-300 text-blue-600" />
              <Label htmlFor="new" className="flex-1 cursor-pointer text-gray-700">
                Create New VCC
                <p className="text-sm text-gray-500">Generate a new virtual credit card</p>
              </Label>
            </div>
          </RadioGroup>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600/25"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    )
  }

  const isOTPStage = stage === "otp"
  const isCredentialsStage = stage === "credentials"

  if (isCredentialsStage || isOTPStage) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Login to Extend
          </h2>
          <p className="text-gray-600">Enter your Extend account credentials</p>
        </div>
        <>
          <div className="space-y-2 mb-4">
            <Label htmlFor="email" className="text-gray-700 text-base">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoginProcessActive && !isCredentialsStage}
              className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600/25"
            />
          </div>

          <div className="space-y-2 mb-8">
            <Label htmlFor="password" className="text-gray-700 text-base">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoginProcessActive && !isCredentialsStage}
                className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600/25 pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-2 flex items-center justify-center transform -translate-y-1/2 hover:bg-gray-100 focus:ring-0 top-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoginProcessActive && !isCredentialsStage}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>


          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStage("mode")}
              disabled={isLoginProcessActive}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400"
            >
              Back
            </Button>
            <Button
              onClick={handleLogin}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600/25"
              disabled={isLoginProcessActive || !email || !password}
            >
              {!isLoading && isLoginProcessActive && isCredentialsStage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </div>
        </>
        {!error && (isOTPStage || !!otpError) ? <div className="flex flex-col gap-2">
          <div className="space-y-2 mt-8">
            <div className="flex justify-between items-center">
              <Label htmlFor="otp" className="text-gray-700 text-base">One-Time Password</Label>
              <span className="text-xs text-gray-500">It can take up to 1 minute to receive the OTP</span>
            </div>
            <Input
              autoFocus={isOTPStage}
              id="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value)
                setError(null)
              }}
              disabled={(isLoading && isLoginProcessActive) || isCredentialsStage}
              className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600/25 text-center text-lg tracking-widest"
            />
          </div>

          {otpError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertDescription>{otpError}. Please login again to send a new OTP.</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleOtpSubmit}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600/25"
              disabled={(isLoading && isLoginProcessActive) || !otp || !!otpError}
            >
              {(isLoading && isLoginProcessActive) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>
          </div>
        </div> : null}
      </div>
    )
  }

  if (stage === "csv-upload") {
    return (
      <div className="w-full max-w-lg mx-auto relative z-50">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Configure Virtual Cards
          </h2>
          <p className="text-gray-600">Set up the parameters for your virtual credit cards</p>
        </div>
        <div className="space-y-4 relative z-50">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gen-count" className="text-gray-700 text-base">Number of Cards</Label>
              <Input
                id="gen-count"
                type="number"
                min="1"
                max="100"
                value={genCount}
                onChange={(e) => {
                  const value = e.target.value === "" ? "" : Number.parseInt(e.target.value);
                  setGenCount(value);
                }}
                disabled={isLoading}
                className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600/25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit" className="text-gray-700 text-base">Credit Limit</Label>
              <Input
                id="limit"
                type="text"
                value={limit}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, '');
                  if (value === '') {
                    setLimit('$');
                  } else {
                    setLimit(`$${value}`);
                  }
                }}
                disabled={isLoading}
                className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600/25"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-period" className="text-gray-700 text-base">Reset Period</Label>
            <Select
              value={recurrenceFrequency}
              onValueChange={(value) => setRecurrenceFrequency(value as "Daily" | "Weekly" | "Monthly")}
            >
              <SelectTrigger id="reset-period" className="w-full">
                <SelectValue placeholder="Select reset period" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                className="w-[var(--radix-select-trigger-width)] z-[60] bg-white max-h-none"
                style={{ zIndex: 9999 }}
              >
                <SelectItem value="Daily" className="hover:bg-gray-50">
                  <div className="font-medium text-gray-800">Daily</div>
                </SelectItem>
                <SelectItem value="Weekly" className="hover:bg-gray-50">
                  <div className="font-medium text-gray-800">Weekly</div>
                </SelectItem>
                <SelectItem value="Monthly" className="hover:bg-gray-50">
                  <div className="font-medium text-gray-800">Monthly</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurrenceFrequency === "Weekly" && (
            <div className="space-y-2">
              <Label htmlFor="Weekly-reset" className="text-gray-700 text-base">Weekly Reset Day</Label>
              <Select
                value={weeklyResetDay}
                onValueChange={setWeeklyResetDay}
                disabled={isLoading}
              >
                <SelectTrigger id="Weekly-reset" className="w-full bg-gray-50">
                  <SelectValue placeholder="Select day (defaults to yesterday)" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  className="w-[var(--radix-select-trigger-width)] z-[60] bg-white max-h-none"
                  style={{ zIndex: 9999 }}
                >
                  <SelectItem value="Sunday" className="hover:bg-gray-50">
                    <div className="font-medium text-gray-800">Sunday</div>
                  </SelectItem>
                  <SelectItem value="Monday" className="hover:bg-gray-50">
                    <div className="font-medium text-gray-800">Monday</div>
                  </SelectItem>
                  <SelectItem value="Tuesday" className="hover:bg-gray-50">
                    <div className="font-medium text-gray-800">Tuesday</div>
                  </SelectItem>
                  <SelectItem value="Wednesday" className="hover:bg-gray-50">
                    <div className="font-medium text-gray-800">Wednesday</div>
                  </SelectItem>
                  <SelectItem value="Thursday" className="hover:bg-gray-50">
                    <div className="font-medium text-gray-800">Thursday</div>
                  </SelectItem>
                  <SelectItem value="Friday" className="hover:bg-gray-50">
                    <div className="font-medium text-gray-800">Friday</div>
                  </SelectItem>
                  <SelectItem value="Saturday" className="hover:bg-gray-50">
                    <div className="font-medium text-gray-800">Saturday</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {recurrenceFrequency === "Monthly" && (
            <div className="space-y-2">
              <Label htmlFor="monthly-reset" className="text-gray-700 text-base">Monthly Reset Day</Label>
              <Input
                id="monthly-reset"
                type="number"
                min="1"
                max="31"
                placeholder="Auto (29 days from now)"
                value={monthlyResetDay}
                onChange={(e) => setMonthlyResetDay(e.target.value)}
                disabled={isLoading}
                className="bg-gray-50 border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600/25"
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStage("source-selection")}
              disabled={isLoading}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400"
            >
              Back
            </Button>
            <Button
              onClick={() => {
                setStage("creating")
                createBulkVirtualCards()
              }}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600/25"
              disabled={isLoading || genCount === "" || Number(genCount) <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Virtual Cards"
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === "source-selection") {
    return (
      <div className="w-full max-w-md mx-auto relative z-50">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Select Source Card for New VCCs
          </h2>
          <p className="text-gray-600">Choose a source card to create new virtual cards from: </p>
        </div>
        <div className="space-y-4">
          <div className="relative z-50">
            <Select value={selectedSourceCard} onValueChange={setSelectedSourceCard}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a source card" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                className="w-[var(--radix-select-trigger-width)] z-[60] bg-white max-h-none"
                style={{ zIndex: 9999 }}
              >
                {sourceCards.map((card) => (
                  <SelectItem
                    key={card.id}
                    value={card.id}
                    className="hover:bg-gray-50"
                  >
                    <div className="font-medium text-gray-800">{card.displayName}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStage("mode")}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400"
            >
              Back
            </Button>
            <Button
              onClick={() => setStage("csv-upload")}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600/25"
              disabled={!selectedSourceCard}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === "creating") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="py-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {bulkCreationStage === 'creating' && 'Creating Virtual Cards'}
                  {bulkCreationStage === 'sleeping' && 'Waiting for Cards to Process'}
                  {bulkCreationStage === 'fetching' && 'Fetching Existing VCCs'}
                </h3>
                <p className="text-sm text-gray-500">
                  {bulkCreationStage === 'creating' && `Creating ${bulkCreationTotal} virtual cards`}
                  {bulkCreationStage === 'sleeping' && `Please wait while the cards are being processed by the system`}
                  {bulkCreationStage === 'fetching' && 'This may take several minutes depending on the number of cards'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Progress</span>
                <span>
                  {bulkCreationStage === 'creating' && `${bulkCreationCurrent} / ${bulkCreationTotal} cards created`}
                  {bulkCreationStage === 'sleeping' && `${sleepTimeRemaining}s remaining`}
                  {bulkCreationStage === 'fetching' && `${existingVCCCurrent} / ${existingVCCMaxProgress} cards processed`}
                </span>
              </div>
              <div className="relative">
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: bulkCreationStage === 'sleeping'
                        ? `${((60 - sleepTimeRemaining) / 60) * 100}%`
                        : bulkCreationStage === 'fetching'
                          ? `${existingVCCProgress}%`
                          : `${bulkCreationProgress}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Stage indicator */}
            <div className="flex justify-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${bulkCreationStage === 'creating' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${bulkCreationStage === 'sleeping' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${bulkCreationStage === 'fetching' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (stage === "fetching") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="py-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <div>
              <h3 className="font-semibold text-gray-800">Fetching your cards...</h3>
              <p className="text-sm text-gray-500">This may take a moment</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (stage === "imported") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Your Imported VCC Cards
          </h2>
        </div>
        <div className="flex flex-col h-[60vh]">
          <div className="text-base text-gray-700 mb-4">
            You have imported <span className="font-medium text-gray-900">{importedCards?.length || 0}</span> Extend VCC cards
          </div>
          <div className="flex-1 overflow-y-auto mb-4">
            {importedCards?.map((card, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white hover:border-gray-300 transition-all duration-200 mb-2 last:mb-0">
                <p className="font-medium text-gray-800">{card.holderName}</p>
                <p className="text-sm text-gray-500">**** **** **** {card.number.slice(-4)}</p>
                <p className="text-sm text-gray-600">Exp: {card.exp} | CVV: {card.cvv}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleClearAndRestart}
              className="flex-1 group border-gray-300 text-gray-700 hover:text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
              variant="outline"
            >
              Reset & Start Over
            </Button>
            <Button
              onClick={() => {
                onClose?.();
              }}
              className="flex-1 bg-white border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700"
              variant="outline"
            >
              Use These Cards
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === "existing-source-selection") {
    const allSelected = sourceCards.length > 0 && selectedSourceCards.length === sourceCards.length

    const toggleSourceCard = (cardId: string) => {
      setSelectedSourceCards(prev =>
        prev.includes(cardId)
          ? prev.filter(id => id !== cardId)
          : [...prev, cardId]
      )
    }

    const toggleAll = () => {
      if (allSelected) {
        setSelectedSourceCards([])
      } else {
        setSelectedSourceCards(sourceCards.map(c => c.id))
      }
    }

    return (
      <div className="w-full max-w-md mx-auto relative z-50">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Select Source Cards for Existing VCCs
          </h2>
          <p className="text-gray-600">Choose one or more source cards to fetch your existing virtual cards from:</p>
        </div>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={toggleAll}
            >
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                className="pointer-events-none"
              />
              <span className="text-sm font-medium text-gray-700">
                {allSelected ? "Deselect All" : "Select All"} ({sourceCards.length} cards)
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {sourceCards.map((card) => {
                const isChecked = selectedSourceCards.includes(card.id)
                return (
                  <div
                    key={card.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isChecked ? "bg-blue-50 hover:bg-blue-100" : "bg-white hover:bg-gray-50"}`}
                    onClick={() => toggleSourceCard(card.id)}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSourceCard(card.id)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{card.displayName}</div>
                      <div className="text-xs text-gray-500 truncate">{card.companyName}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedSourceCards.length > 0 && (
            <p className="text-sm text-gray-500">
              {selectedSourceCards.length} card{selectedSourceCards.length !== 1 ? "s" : ""} selected
            </p>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStage("mode")}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400"
            >
              Back
            </Button>
            <Button
              onClick={() => {
                setStage("existing-fetching")
              }}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600/25"
              disabled={selectedSourceCards.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                `Fetch Existing VCCs (${selectedSourceCards.length} source${selectedSourceCards.length !== 1 ? "s" : ""})`
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === "existing-fetching") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="py-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Fetching VCCs</h3>
                <p className="text-sm text-gray-500">This may take several minutes depending on the number of cards</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Progress</span>
                <span>{existingVCCCurrent} / {existingVCCMaxProgress} cards processed</span>
              </div>
              <div className="relative">
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${existingVCCProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return null
}