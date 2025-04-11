import { X } from "lucide-react";
import { motion } from "framer-motion";

interface ClientAccessInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientAccessInfoModal({
  isOpen,
  onClose,
}: ClientAccessInfoModalProps) {
  if (!isOpen) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        className="bg-white rounded-lg p-6 w-full max-w-sm"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Welcome to Zoom Creatives</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            This portal is exclusively for Zoom Creatives clients. When you’re added as a client,
            you’ll automatically receive your email and password to access your account. No manual
            sign-up is needed—our team will set everything up for you.
          </p>
          <p className="text-gray-600">
            Questions? Contact us at{" "}
            <a
              href="mailto:support@zoomcreatives.com"
              className="text-yellow-600 hover:underline"
            >
              support@zoomcreatives.com
            </a>.
          </p>
          <div className="flex justify-end">
            <a
              href="mailto:support@zoomcreatives.com"
              className="inline-flex items-center px-4 py-2 bg-black text-yellow-400 rounded-lg font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}