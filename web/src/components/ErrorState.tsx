import styles from './ErrorState.module.css'

export function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className={styles.error} role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  )
}
