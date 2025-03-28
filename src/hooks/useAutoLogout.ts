// src/hooks/useAutoLogout.ts
import { useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

export const useAutoLogout = (timeout = 10 * 60 * 1000) => { // 10 minutos de inactividad por defecto
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      signOut(auth)
        .then(() => {
          alert("Cierre de sesión por inactividad");
          navigate('/login');
        })
        .catch((error) => {
          console.error("Error al cerrar sesión por inactividad", error);
        });
    }, timeout);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    // Iniciar el temporizador
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return;
};
