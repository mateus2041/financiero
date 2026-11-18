import { useEffect } from "react";

export default function useModalDismissal(isOpen, setIsOpen, lockBodyScroll = false) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (lockBodyScroll) document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      if (lockBodyScroll) document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, setIsOpen, lockBodyScroll]);
}
