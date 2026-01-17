import React, { useState, useEffect } from "react";
import { Button, ButtonProps } from "./button";

interface CountdownButtonProps extends ButtonProps {
    countdownSeconds?: number;
    onComplete: () => void;
    text?: string;
}

export function CountdownButton({
    countdownSeconds = 5,
    onComplete,
    text = "Delete",
    className,
    variant = "danger",
    disabled,
    ...props
}: CountdownButtonProps) {
    const [timeLeft, setTimeLeft] = useState(countdownSeconds);

    useEffect(() => {
        if (timeLeft === 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (timeLeft > 0) return; // Prevention
        onComplete();
    };

    return (
        <Button
            {...props}
            variant={timeLeft > 0 ? "outline" : variant} // Look disabled/neutral while counting
            disabled={disabled || timeLeft > 0}
            onClick={handleClick}
            className={`${className} transition-all duration-200`}
        >
            {timeLeft > 0 ? `${text} (${timeLeft}s)` : text}
        </Button>
    );
}
