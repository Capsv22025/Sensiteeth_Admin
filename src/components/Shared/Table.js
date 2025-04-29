import React from 'react';
import styles from '../AdminDashboard/AdminDashboard.module.css'; // Adjusted path

const Table = ({ data, columns, renderRowExpansion }) => {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.header} className={styles.tableHeader}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <React.Fragment key={item.id || index}>
            <tr className={styles.tableRow}>
              {columns.map(col => (
                <td key={col.header} className={styles.tableCell}>
                  {typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor]}
                </td>
              ))}
            </tr>
            {renderRowExpansion && (
              <tr className={styles.expansionRow}>
                <td colSpan={columns.length} className={styles.expansionCell}>
                  {renderRowExpansion(item)}
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};

export default Table;