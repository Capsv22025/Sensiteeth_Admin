import React from 'react';
import styles from '../AdminDashboard/AdminDashboard.module.css';

const Modal = ({ onClose, children }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.modalCloseButton}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;