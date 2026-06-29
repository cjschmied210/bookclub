"use client";

import { useEffect, useState } from "react";
import Header from "./components/Header";
import Link from "next/link";
import styles from "./page.module.css";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";

interface BookCover {
  isbn: string;
  bookTitle: string;
  bookAuthor: string;
  bookCoverUrl: string;
}

export default function Home() {
  const [books, setBooks] = useState<BookCover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(collection(db, "books"), orderBy("addedAt", "desc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({
          isbn: doc.id,
          bookTitle: doc.data().title,
          bookAuthor: doc.data().author,
          bookCoverUrl: doc.data().coverUrl,
        })) as BookCover[];
        setBooks(fetched);
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <>
      <div className="container">
        <Header />
      </div>
        <main className={styles.archiveList}>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: '4rem' }}>
            Loading Library...
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <div className="container">
        <Header />
      </div>
      
      <main className={styles.archiveList}>
        {books.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)', textAlign: 'center' }}>The library is empty. Awaiting the first reflection...</p>
        ) : (
          <div className={styles.bookGrid}>
            {books.map((book) => (
              <Link href={`/book/${book.isbn}`} key={book.isbn} className={styles.bookCoverLink}>
                {book.bookCoverUrl ? (
                  <img src={book.bookCoverUrl.replace('&edge=curl', '').replace(/&zoom=\d/, '&zoom=0')} alt={book.bookTitle} className={styles.gridCover} />
                ) : (
                  <div className={styles.placeholderCover}>
                    <span>{book.bookTitle}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
