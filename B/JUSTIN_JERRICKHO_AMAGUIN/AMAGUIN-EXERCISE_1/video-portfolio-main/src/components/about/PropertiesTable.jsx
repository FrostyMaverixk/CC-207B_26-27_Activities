import styles from './PropertiesTable.module.css';

/**
 * Clip-properties table (Phase 4 task 8): dotted-leader rows, mono keys in
 * --text-1, values in --text-0. The STATUS row goes teal when `available`
 * is true and amber when false (driven by about.availability, per §5.3) —
 * independent of wording.
 *
 * @param {Object} props
 * @param {Record<string, string>} props.properties
 * @param {boolean} props.available  open-to-work flag → teal STATUS row
 */
export default function PropertiesTable({ properties, available }) {
  return (
    <dl className={styles.table}>
      {Object.entries(properties).map(([key, value]) => {
        const statusTone =
          key !== 'STATUS' ? '' : available ? styles.available : styles.booked;
        return (
          <div key={key} className={styles.row}>
            <dt className={styles.key}>{key}</dt>
            <dd className={`${styles.value} ${statusTone}`}>{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
