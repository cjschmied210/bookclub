"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, getCountFromServer } from "firebase/firestore";
import { db } from "../../firebase";
import Header from "../components/Header";
import EntryAirlock from "../components/EntryAirlock";
import styles from "./write.module.css";

interface BookOption {
  isbn: string;
  title: string;
  author: string;
}

export default function WritePage() {
  const [books, setBooks] = useState<BookOption[]>([]);
  const [selectedIsbn, setSelectedIsbn] = useState("");
  const [content, setContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(collection(db, "books"), orderBy("addedAt", "desc"));
        const snapshot = await getDocs(q);
        const fetchedBooks = snapshot.docs.map(doc => ({
          isbn: doc.id,
          title: doc.data().title,
          author: doc.data().author
        }));
        setBooks(fetchedBooks);
      } catch (error) {
        console.error("Error fetching books", error);
      }
    };
    fetchBooks();
  }, []);

  const handlePublish = async () => {
    if (!selectedIsbn || !content) return;
    setIsPublishing(true);
    try {
      const snap = await getCountFromServer(collection(db, "reflections"));
      const nextNumber = snap.data().count + 1;

      const selectedBook = books.find(b => b.isbn === selectedIsbn);
      await addDoc(collection(db, "reflections"), {
        isbn: selectedIsbn,
        bookTitle: selectedBook?.title,
        bookAuthor: selectedBook?.author,
        member: `Reflection #${nextNumber}`,
        content: content,
        createdAt: serverTimestamp(),
      });
      alert("Reflection published successfully to the Book Club!");
      router.push(`/book/${selectedIsbn}`);
    } catch (error) {
      console.error("Error publishing reflection", error);
      alert("Failed to publish reflection.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <EntryAirlock>
      <div className="container">
        <Header />
        
        <main className={styles.writeMain}>
          <header className={styles.writeHeader}>
            <h2>Publish a New Reflection</h2>
            <p>Select a book from the library and paste the Markdown content. It will be published anonymously and numbered successively.</p>
          </header>

          <div className={styles.editorGrid}>
            <section className={styles.lookupSection}>

              <div className={styles.inputGroup}>
                <label>Select Book</label>
                <select value={selectedIsbn} onChange={(e) => setSelectedIsbn(e.target.value)} className={styles.inputField}>
                  <option value="">Select a book from the library...</option>
                  {books.map(b => (
                    <option key={b.isbn} value={b.isbn}>{b.title} by {b.author}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className={styles.editorSection}>
              <div className={styles.inputGroup}>
                <label>Reflection (Markdown Supported)</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste their reflection here..."
                  className={styles.textareaField}
                />
              </div>

              <div className={styles.actionRow}>
                <button 
                  className={styles.publishButton} 
                  disabled={!selectedIsbn || !content || isPublishing}
                  onClick={handlePublish}
                >
                  {isPublishing ? "Publishing..." : "Publish to Archive"}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </EntryAirlock>
  );
}
