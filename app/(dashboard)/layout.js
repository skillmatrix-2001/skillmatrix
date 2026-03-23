import Chatbot from "@/components/Chatbot";

export default function DashboardLayout({ children }) {
  return (
    <div>
      {children}
      <Chatbot />
    </div>
  );
}
