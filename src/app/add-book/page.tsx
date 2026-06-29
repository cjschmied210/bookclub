"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import Header from "../components/Header";
import EntryAirlock from "../components/EntryAirlock";
import { fetchGoogleBook } from "../actions/lookupBook";
import styles from "./add-book.module.css";

export default function AddBookPage() {
  const [isbn, setIsbn] = useState("");
  const [loadingBook, setLoadingBook] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Manual Entry States
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualCover, setManualCover] = useState("");

  const [bookData, setBookData] = useState<{title: string, author: string, coverUrl?: string} | null>(null);
  const router = useRouter();

  const handleIsbnLookup = async () => {
    if (!isbn) return;
    setLoadingBook(true);
    try {
      // Calls the secure server action to hide the API key
      const data = await fetchGoogleBook(isbn);
      
      if (data && data.items && data.items.length > 0) {
        const bookInfo = data.items[0].volumeInfo;
        setBookData({
          title: bookInfo.title,
          author: bookInfo.authors ? bookInfo.authors.join(", ") : "Unknown Author",
          coverUrl: bookInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || undefined
        });
      } else {
        alert("Book not found on Google Books. Please check the ISBN.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error fetching book data.");
    } finally {
      setLoadingBook(false);
    }
  };

  const handleAddBook = async () => {
    // Determine which dataset to use based on manual override
    const activeIsbn = isManualEntry ? isbn.replace(/-/g, '').trim() : isbn.replace(/-/g, '').trim();
    const activeTitle = isManualEntry ? manualTitle : bookData?.title;
    const activeAuthor = isManualEntry ? manualAuthor : bookData?.author;
    const activeCover = isManualEntry ? manualCover : bookData?.coverUrl;

    if (!activeIsbn || !activeTitle || !activeAuthor) return;

    setIsAdding(true);
    try {
      await setDoc(doc(db, "books", activeIsbn), {
        isbn: activeIsbn,
        title: activeTitle,
        author: activeAuthor,
        coverUrl: activeCover || null,
        addedAt: serverTimestamp(),
      });
      alert("Book added to the Library!");
      router.push("/");
    } catch (error) {
      console.error("Error adding book", error);
      alert("Failed to add book.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <EntryAirlock>
      <div className="container">
        <Header />
        
        <main className={styles.main}>
          <header className={styles.header}>
            <h2>Add a Book to the Library</h2>
            <p>Enter the ISBN to fetch the cover and details before members can write reflections on it.</p>
          </header>

          <section className={styles.section}>
            <div className={styles.inputGroup}>
              <label>Book Identity Lookup (ISBN)</label>
              <div className={styles.lookupControls}>
                <input 
                  type="text" 
                  placeholder="e.g. 9780593083321" 
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className={styles.inputField}
                />
                <button onClick={handleIsbnLookup} disabled={loadingBook || isManualEntry} className={styles.lookupButton}>
                  {loadingBook ? "Searching..." : "Fetch Book"}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
              <button 
                onClick={() => setIsManualEntry(!isManualEntry)}
                style={{ 
                  background: 'none', border: 'none', color: 'var(--color-sage)', 
                  fontFamily: 'var(--font-sans)', fontSize: '0.85rem', cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isManualEntry ? "← Return to Auto-Fetch" : "API Failing? Enter manually instead."}
              </button>
            </div>

            {isManualEntry ? (
              <div className={styles.manualEntryGrid}>
                 <div className={styles.inputGroup}>
                  <label>Manual Title</label>
                  <input type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)} className={styles.inputField} placeholder="The Creative Act" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Manual Author</label>
                  <input type="text" value={manualAuthor} onChange={e => setManualAuthor(e.target.value)} className={styles.inputField} placeholder="Rick Rubin" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Cover Image URL (Optional)</label>
                  <input type="text" value={manualCover} onChange={e => setManualCover(e.target.value)} className={styles.inputField} placeholder="https://..." />
                </div>
              </div>
            ) : (
              bookData && (
                <div className={styles.bookCard}>
                  {bookData.coverUrl && (
                    <img src={bookData.coverUrl.replace('&edge=curl', '').replace(/&zoom=\d/, '&zoom=0')} alt={bookData.title} className={styles.bookCover} />
                  )}
                  <div className={styles.bookInfo}>
                    <h4>{bookData.title}</h4>
                    <span>{bookData.author}</span>
                  </div>
                </div>
              )
            )}

             <div className={styles.actionRow}>
              <button 
                className={styles.addButton} 
                disabled={(isManualEntry ? (!manualTitle || !manualAuthor || !isbn) : (!bookData || !isbn)) || isAdding}
                onClick={handleAddBook}
              >
                {isAdding ? "Adding..." : "Add to Library"}
              </button>
            </div>
          </section>
        </main>
      </div>
    </EntryAirlock>
  );
}
