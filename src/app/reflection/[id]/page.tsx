"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import Header from "../../components/Header";
import ReactMarkdown from "react-markdown";
import styles from "../reflection.module.css";

interface Reflection {
  bookTitle: string;
  bookAuthor: string;
  member: string;
  content: string;
  createdAt: any;
}

export default function DynamicReflectionPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchReflection = async () => {
      try {
        const docRef = doc(db, "reflections", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setReflection(docSnap.data() as Reflection);
        } else {
          console.error("No such reflection found!");
        }
      } catch (error) {
        console.error("Error fetching reflection:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReflection();
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <Header />
        <main className={styles.reflectionMain}>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: '4rem' }}>
            Retrieving from the Archive...
          </p>
        </main>
      </div>
    );
  }

  if (!reflection) {
    return (
      <div className="container">
        <Header />
        <main className={styles.reflectionMain}>
          <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: '4rem' }}>
            Reflection not found.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      
      <main className={styles.reflectionMain}>
        <header className={styles.postHeader}>
          <span className="reflection-date">
            {reflection.createdAt?.toDate ? reflection.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
          </span>
          <h1 className="reflection-title">{reflection.bookTitle}</h1>
          <span className="reflection-author">Reflected by {reflection.member}</span>
        </header>

        <article className={styles.postBody}>
          <ReactMarkdown>{reflection.content}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
