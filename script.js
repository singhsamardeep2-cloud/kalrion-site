const whatsappNumber = "918447842244";

const buildWhatsAppUrl = (data) => {
  const name = data.get("name") || "";
  const phone = data.get("phone") || "";
  const need = data.get("need") || "Insurance guidance";
  const message = data.get("message") || "";

  const text = [
    "Hi Kalrion Capital, I want help with insurance.",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Need: ${need}`,
    message ? `Message: ${message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
};

const handleForm = (formId, noteId) => {
  const form = document.getElementById(formId);
  const note = document.getElementById(noteId);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    note.textContent = "Opening WhatsApp with your enquiry details.";
    window.location.href = buildWhatsAppUrl(data);
  });
};

handleForm("quote-form", "form-note");
handleForm("contact-form", "contact-note");
