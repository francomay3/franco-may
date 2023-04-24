import { toast } from "@/components/design-system";

type MailData = {
  name: string;
  email: string;
  message: string;
};

export const sendMail = async (mailData: MailData) => {
  return toast.promise(
    fetch("/api/contact", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailData),
    }),
    {
      pending: "Sending message...",
      success: "MessagesSent!",
      error: "Error sending message",
    }
  );
};
