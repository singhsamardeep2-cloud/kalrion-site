const buildMailto = (data) => {
  const subject = encodeURIComponent(`Insurance enquiry from ${data.get("name") || "Kalrion website"}`);
  const body = encodeURIComponent(
    [
      `Name: ${data.get("name") || ""}`,
      `Phone: ${data.get("phone") || ""}`,
      `Insurance need: ${data.get("need") || ""}`,
      `Message: ${data.get("message") || ""}`,
    ].join("\n")
  );

  return `mailto:hello@kalrion.in?subject=${subject}&body=${body}`;
};

const handleForm = (formId, noteId) => {
  const form = document.getElementById(formId);
  const note = document.getElementById(noteId);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    note.textContent = "Opening an email draft with your details.";
    window.location.href = buildMailto(data);
  });
};

handleForm("quote-form", "form-note");
handleForm("contact-form", "contact-note");
