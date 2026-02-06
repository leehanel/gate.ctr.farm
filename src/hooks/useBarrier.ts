import { useEffect, useRef, useState } from 'react';

export const CLOUDFLARE_API = 'https://pin-api.ctr-gate.workers.dev';

export function useBarrier() {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [deviceOnline, setDeviceOnline] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [justOpened, setJustOpened] = useState<boolean>(false);

  const pinRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    fetch(`${CLOUDFLARE_API}/device-status`)
      .then(res => res.json())
      .then(data => setDeviceOnline(data.online))
      .catch(() => setDeviceOnline(false));
  }, []);

  const updatePin = (index: number, value: string) => {
    if (value.length > 1) return;

    const updated = [...pin];
    updated[index] = value;
    setPin(updated);

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const triggerBarrier = async () => {
    const entered = pin.join('');
    if (entered.length !== 4) return;

    setStatus('Verificare PIN...');
    setStatusType('info');

    try {
      const response = await fetch(`${CLOUDFLARE_API}/open-barrier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: entered }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('✅ Barieră deschisă');
        setStatusType('success');
        setJustOpened(true);
        setTimeout(() => {
          setJustOpened(false);
          setStatus('');
        }, 3000);
        setPin(['', '', '', '']);
        pinRefs.current[0]?.focus();
      } else {
        setStatus('PIN greșit sau expirat');
        setStatusType('error');
        setPin(['', '', '', '']);
        pinRefs.current[0]?.focus();
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setStatus('Eroare la trimiterea cererii');
      setStatusType('error');
    }
  };

  return {
    pin,
    updatePin,
    handleKeyDown,
    deviceOnline,
    status,
    statusType,
    triggerBarrier,
    isReady: !pin.includes('') && deviceOnline,
    pinRefs,
    justOpened
  };
}
