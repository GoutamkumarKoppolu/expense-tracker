import { MessageCircle, Phone } from "lucide-react";
import { whatsappNumber } from "./domain";

// Call and WhatsApp for a saved number. Plain links: on Android they open the
// dialer and WhatsApp, in a browser tel:/wa.me links work the same way.
export default function ContactButtons({ phone, person }) {
  const wa = whatsappNumber(phone);
  return (
    <div className="contact-row">
      <span className="contact-number">{phone}</span>
      <a className="btn btn-soft contact-btn" href={`tel:${phone}`} aria-label={`Call ${person}`}>
        <Phone size={17} /> Call
      </a>
      {wa && (
        <a
          className="btn btn-soft contact-btn"
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`WhatsApp ${person}`}
        >
          <MessageCircle size={17} /> WhatsApp
        </a>
      )}
    </div>
  );
}
