import { NextRequest, NextResponse } from "next/server";

// Only validate US zip codes
const US_ZIP_FORMAT = /^\d{5}(-\d{4})?$/;  // 12345 or 12345-6789

function validateZipCode(zipcode: string, country: string): boolean {
  // Only validate format for USA
  if (country !== 'US') return true;
  return US_ZIP_FORMAT.test(zipcode);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const zipcode = url.searchParams.get("zipcode")?.trim();
  const country = url.searchParams.get("country")?.toUpperCase();

  if (!zipcode || !country) {
    return NextResponse.json({ error: "Missing zipcode or country" }, { status: 400 });
  }

  // Only proceed with validation and lookup for US addresses
  if (country !== 'US') {
    return NextResponse.json({
      city: "",
      state: "",
      stateAbbr: "",
    });
  }

  // For US addresses, validate the format
  if (!validateZipCode(zipcode, country)) {
    return NextResponse.json({ error: "Please enter a valid US ZIP code (5 digits)" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    // For US zip codes, remove the optional 4-digit extension before API call
    const baseZipcode = zipcode.split('-')[0];

    const apiRes = await fetch(`https://api.zippopotam.us/us/${baseZipcode}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!apiRes.ok) {
      // Don't treat this as an error, just return empty values
      return NextResponse.json({
        city: "",
        state: "",
        stateAbbr: "",
      });
    }

    const data = await apiRes.json();
    const place = data.places?.[0];

    if (!place) {
      // Don't treat this as an error, just return empty values
      return NextResponse.json({
        city: "",
        state: "",
        stateAbbr: "",
      });
    }

    return NextResponse.json({
      city: place["place name"] || "",
      state: place["state"] || "",
      stateAbbr: place["state abbreviation"] || "",
    });
  } catch (error) {
    // Don't treat API errors as validation errors, just return empty values
    return NextResponse.json({
      city: "",
      state: "",
      stateAbbr: "",
    });
  }
}
