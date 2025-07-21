import React from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Notifications.module.css';
import { Loader } from 'lucide-react';

const Notifications = ({ notifications }) => {
    return ReactDOM.createPortal(
        <div className={styles.container}>
            <AnimatePresence>
                {notifications.map(note => (
                    <motion.div
                        key={note.id}
                        className={`${styles.notification} ${styles[note.type]}`}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        {note.type === 'loading' && <Loader size={18} className={styles.spinner} />}
                        {note.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>,
        document.getElementById('portal-root')
    );
};

export default Notifications;