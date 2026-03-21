import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

  if (!text) {
    return NextResponse.json({ results: [] });
  }

  if (!apiKey) {
    console.error("Yandex Maps API Key not found in environment");
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  try {
    // Yandex Suggest HTTP API v1
    // Reference: https://yandex.com/dev/maps/suggest/
    const url = new URL("https://suggest-maps.yandex.ru/v1/suggest");
    url.searchParams.append("apikey", apiKey);
    url.searchParams.append("text", text);
    url.searchParams.append("lang", "ru_RU");
    url.searchParams.append("results", "10");
    url.searchParams.append("print_address", "1"); // Returns full address format

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Yandex Suggest API Error:", response.status, errorText);
      return NextResponse.json({ error: "Upstream Error" }, { status: response.status });
    }

    const data = await response.json();
    
    // Map Yandex v1 results to a standard format for our frontend
    // The structure is typically { results: [ { title: { text: ... }, subtitle: { text: ... }, ... } ] }
    const formattedResults = data.results?.map((item: any) => ({
      value: item.title.text + (item.subtitle?.text ? `, ${item.subtitle.text}` : ""),
      displayName: item.title.text,
      address: item.subtitle?.text || "",
      fullAddress: item.title.text + (item.subtitle?.text ? `, ${item.subtitle.text}` : ""),
    })) || [];

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error("Internal Error in Location Suggest:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
