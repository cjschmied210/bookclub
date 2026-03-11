"use server";

export async function fetchGoogleBook(isbn: string) {
  const cleanIsbn = isbn.replace(/-/g, '').trim();
  if (!cleanIsbn) throw new Error("Please enter a valid ISBN.");

  // Access the private API key strictly on the server
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const apiKeyStr = apiKey ? `&key=${apiKey}` : "";

  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}${apiKeyStr}`);
    
    if (!res.ok) {
      if (res.status === 429) {
         throw new Error("429: Too Many Requests. The Google Books Free API limit has been reached.");
      }
      const errText = await res.text();
      console.error("RAW GOOGLE API ERROR BODY:", errText);
      throw new Error(`Google Books API Error: ${res.status} | Details: ${errText}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch book data from the server.");
  }
}
