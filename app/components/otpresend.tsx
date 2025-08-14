import { useState, useEffect } from 'react';

type OtpResendTimerProps = {
  onResend: () => void;  
};

export default function OtpResendTimer({ onResend }: OtpResendTimerProps) {
  const [timer, setTimer] = useState(0);

  const handleResendClick = () => {
    onResend();  
    setTimer(120); 
  };

  useEffect(() => {
    if (timer <= 0) return;

    const id = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1_000);

    return () => clearInterval(id);
  }, [timer]);

  return (
    <div className="flex items-center justify-end text-sm text-foreground">
      <span className="text-muted-foreground">
        Didn’t receive an OTP?{' '}
      </span>
      {timer > 0 ? (
        <span className="text-black ml-1">
          Resend in {timer}s
        </span>
      ) : (
        <span
          className="text-primary underline ml-1 cursor-pointer"
          onClick={handleResendClick}
        >
          Resend OTP
        </span>
      )}
    </div>
  );
}
