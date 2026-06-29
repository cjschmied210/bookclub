"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../../../firebase";
import Header from "../../components/Header";
import ReactMarkdown from "react-markdown";
import styles from "./book.module.css";
import { useAuth } from "../../context/AuthContext";

interface Reflection {
  id: string;
  member: string;
  content: string;
  createdAt: any;
}

interface BookInfo {
  title: string;
  author: string;
  coverUrl: string;
}

export default function BookReflectionsPage() {
  const params = useParams();
  const isbn = params.isbn as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteBook = async () => {
    if (!window.confirm("Are you sure you want to delete this book? This will permanently remove all reflections associated with it.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      // 1. Query and delete all reflections for this book
      const reflectionsQuery = query(
        collection(db, "reflections"),
        where("isbn", "==", isbn)
      );
      const querySnapshot = await getDocs(reflectionsQuery);
      
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      // 2. Delete the book document itself
      await deleteDoc(doc(db, "books", isbn));
      
      alert("Book and its reflections successfully deleted.");
      router.push("/");
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Failed to delete book.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!isbn) return;
    const fetchData = async () => {
      try {
        // Fetch book info from books collection
        const bookDocRef = doc(db, "books", isbn);
        const bookDocSnap = await getDoc(bookDocRef);
        if (bookDocSnap.exists()) {
          setBookInfo({
            title: bookDocSnap.data().title,
            author: bookDocSnap.data().author,
            coverUrl: bookDocSnap.data().coverUrl
          });
        }

        // Fetch reflections
        const q = query(
          collection(db, "reflections"), 
          where("isbn", "==", isbn)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          // Fetch all reflections for this book and sort them in memory by newest first
          const fetched = snapshot.docs.map(document => ({
            id: document.id,
            member: document.data().member,
            content: document.data().content,
            createdAt: document.data().createdAt
          })).sort((a, b) => {
            const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
          });
          
          setReflections(fetched);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isbn]);

  if (loading) {
    return (
      <div className="container">
        <Header />
        <main className={styles.bookMain}>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: '4rem' }}>
            Pulling the volume from the shelf...
          </p>
        </main>
      </div>
    );
  }

  if (!bookInfo) {
    return (
      <div className="container">
        <Header />
        <main className={styles.bookMain}>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: '4rem' }}>
            No reflections found for this book.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      
      <main className={styles.bookMain}>
        <header className={styles.bookHeader}>
          {bookInfo.coverUrl && (
            <img src={bookInfo.coverUrl.replace('&edge=curl', '').replace(/&zoom=\d/, '&zoom=0')} alt={bookInfo.title} className={styles.bookCover} />
          )}
          <div className={styles.bookMetadata}>
            <h1 className={styles.bookTitle}>{bookInfo.title}</h1>
            <span className={styles.bookAuthor}>by {bookInfo.author}</span>
            <span className={styles.reflectionCount}>{reflections.length} {reflections.length === 1 ? 'Reflection' : 'Reflections'}</span>
            {user && (
              <button 
                onClick={handleDeleteBook} 
                className={styles.deleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Book"}
              </button>
            )}
          </div>
        </header>

        <div className={styles.reflectionsList}>
          {reflections.map((ref, index) => (
            <article key={ref.id} className={styles.reflectionEntry}>
              <div className={styles.reflectionHeader}>
                <span className={styles.memberTag}>{ref.member}</span>
                <span className={styles.dateTag}>
                  {ref.createdAt?.toDate ? ref.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                </span>
              </div>
              <div className={styles.reflectionContent}>
                <ReactMarkdown>{ref.content}</ReactMarkdown>
              </div>
              {index < reflections.length - 1 && <hr className={styles.divider} />}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
