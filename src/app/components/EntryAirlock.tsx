"use client";

import { useAuth } from "../context/AuthContext";
import styles from "./EntryAirlock.module.css";

export default function EntryAirlock({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className={styles.airlockContainer}>
        <div className={styles.airlockContent}>
          <h1 className="logo" style={{ fontSize: "2rem" }}>Book Club</h1>
          <p className={styles.airlockMessage}>Turning the key...</p>
        </div>
      </div>
    );
  }

  // The login barrier blocks access unless authenticated.
  if (!user) {
    return (
      <div className={styles.airlockContainer}>
        <div className={styles.airlockContent}>
          <h1 className="logo" style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>Book Club</h1>
          <p className={styles.airlockMessage}>
            A private digital repository for deep-dive literary reflections.
          </p>
          <button onClick={signInWithGoogle} className={styles.loginButton}>
            Enter the Book Club
          </button>
        </div>
      </div>
    );
  }

  // If user is authenticated, render the application within the Sanctuary.
  return <>{children}</>;
}
